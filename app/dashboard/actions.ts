"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/actions/auth";
import {
  type CalendarActionResult,
  cancelBookingForOwner,
  createDateException,
  createEvent,
  createPublicBooking,
  deleteDateException,
  rescheduleBookingForOwner,
  setEventActive,
  softDeleteEvent,
  updateEventConfiguration,
  type BookingInput,
  type EventConfigurationInput,
} from "@/lib/calendar-service";
import { parseTimeToMinute, type TimeWindow } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

type InvalidState = { ok: false; error: string };
type ParseResult<T> = { ok: true; input: T } | InvalidState;

const invalidForm = (error: string): InvalidState => ({ ok: false, error });

export async function createEventAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para crear un evento.");

  const parsed = parseEventConfiguration(formData);
  if (!parsed.ok) return parsed;

  let result: CalendarActionResult;
  try {
    result = await createEvent(prisma, ownerId, parsed.input);
  } catch {
    return invalidForm("No se pudo crear el evento. Revisa los datos e inténtalo de nuevo.");
  }
  if (!result.ok || !result.eventId) return result;
  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${result.eventId}`);
}

export async function updateEventConfigAction(
  eventId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para editar este evento.");

  const parsed = parseEventConfiguration(formData);
  if (!parsed.ok) return parsed;

  try {
    const result = await updateEventConfiguration(prisma, ownerId, eventId, parsed.input);
    if (!result.ok) return result;
    revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudieron guardar los cambios. Inténtalo de nuevo.");
  }
}

export async function createDateExceptionAction(
  eventId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para cambiar la disponibilidad.");

  const date = readText(formData, "date");
  const kindValue = readText(formData, "kind");
  const startMinute = parseTimeToMinute(readText(formData, "startTime"));
  const endMinute = parseTimeToMinute(readText(formData, "endTime"));
  if (
    (kindValue !== "OPEN" && kindValue !== "BLOCK") ||
    startMinute === null ||
    endMinute === null
  ) {
    return invalidForm("Elige una fecha, un tipo y una franja horaria válidos.");
  }

  try {
    const result = await createDateException(prisma, ownerId, eventId, {
      date,
      kind: kindValue,
      startMinute,
      endMinute,
    });
    if (result.ok) revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudo guardar la excepción. Inténtalo de nuevo.");
  }
}

export async function deleteDateExceptionAction(
  eventId: string,
  exceptionId: string,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para cambiar la disponibilidad.");

  try {
    const result = await deleteDateException(prisma, ownerId, eventId, exceptionId);
    if (result.ok) revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudo eliminar la excepción. Inténtalo de nuevo.");
  }
}

export async function setEventActiveAction(
  eventId: string,
  isActive: boolean,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  if (typeof isActive !== "boolean") {
    return invalidForm("El estado del evento no es válido.");
  }
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para cambiar el estado del evento.");

  try {
    const result = await setEventActive(prisma, ownerId, eventId, isActive);
    if (result.ok) revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudo cambiar el estado del evento. Inténtalo de nuevo.");
  }
}

export async function deleteEventAction(
  eventId: string,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para eliminar este evento.");

  let result: CalendarActionResult;
  try {
    result = await softDeleteEvent(prisma, ownerId, eventId);
  } catch {
    return invalidForm("No se pudo eliminar el evento. Inténtalo de nuevo.");
  }
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function cancelBookingAction(
  eventId: string,
  bookingId: string,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para gestionar esta reserva.");

  try {
    const result = await cancelBookingForOwner(prisma, ownerId, eventId, bookingId);
    if (result.ok) revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudo cancelar la reserva. Inténtalo de nuevo.");
  }
}

export async function rescheduleBookingAction(
  eventId: string,
  bookingId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return invalidForm("Inicia sesión para gestionar esta reserva.");

  const parsed = parseBookingInput(formData, { includeName: false });
  if (!parsed.ok) return parsed;

  try {
    const result = await rescheduleBookingForOwner(prisma, ownerId, eventId, bookingId, {
      date: parsed.input.date,
      startTime: parsed.input.startTime,
      mode: parsed.input.mode,
    });
    if (result.ok) revalidateEventPages(eventId);
    return result;
  } catch {
    return invalidForm("No se pudo cambiar el horario. La reserva original se conserva.");
  }
}

export async function createPublicBookingAction(
  token: string,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseBookingInput(formData, { includeName: true });
  if (!parsed.ok) return parsed;

  try {
    const result = await createPublicBooking(prisma, token, parsed.input);
    if (result.ok) {
      revalidatePath(`/reservar/${token}`);
      revalidatePath("/dashboard");
      if (result.eventId) revalidateEventPages(result.eventId);
    }
    return result;
  } catch {
    return invalidForm("No se pudo guardar la reserva. Elige otro horario e inténtalo de nuevo.");
  }
}

function parseEventConfiguration(
  formData: FormData,
): ParseResult<EventConfigurationInput> {
  const title = readText(formData, "title");
  const description = readText(formData, "description") || null;
  const durationMinutes = Number(readText(formData, "durationMinutes"));
  const startDate = readText(formData, "startDate");
  const endDate = readText(formData, "endDate");
  const enabledDays = new Set<number>();

  for (const value of formData.getAll("enabledDays")) {
    if (typeof value !== "string" || !/^[0-6]$/.test(value)) {
      return invalidForm("Revisa los días de la semana seleccionados.");
    }
    enabledDays.add(Number(value));
  }

  const maxWeeklyWindows = 8;
  const hasExtraWindow = [...formData.keys()].some((key) => {
    const match = /^window(?:Start|End)_(\d+)$/.exec(key);
    return Boolean(match && Number(match[1]) >= maxWeeklyWindows && readText(formData, key));
  });
  if (hasExtraWindow) {
    return invalidForm(`Puedes configurar hasta ${maxWeeklyWindows} franjas semanales.`);
  }

  const weeklyWindows: TimeWindow[] = [];
  for (let index = 0; index < maxWeeklyWindows; index += 1) {
    const start = readText(formData, `windowStart_${index}`);
    const end = readText(formData, `windowEnd_${index}`);
    if (!start && !end) continue;
    const startMinute = parseTimeToMinute(start);
    const endMinute = parseTimeToMinute(end);
    if (startMinute === null || endMinute === null) {
      return invalidForm("Completa las horas de cada franja o deja vacía la fila opcional.");
    }
    weeklyWindows.push({ startMinute, endMinute });
  }

  return {
    ok: true,
    input: {
      title,
      description,
      durationMinutes,
      startDate,
      endDate,
      enabledWeekdays: Array.from({ length: 7 }, (_, day) => enabledDays.has(day)),
      weeklyWindows,
    },
  };
}

function parseBookingInput(
  formData: FormData,
  options: { includeName: boolean },
): ParseResult<BookingInput> {
  const modeValue = readText(formData, "mode");
  if (modeValue !== "standard" && modeValue !== "precise") {
    return invalidForm("Elige una hora disponible.");
  }

  const input: BookingInput = {
    date: readText(formData, "date"),
    startTime: readText(formData, "startTime"),
    firstName: options.includeName ? readText(formData, "firstName") : "Organizador",
    lastName: options.includeName ? readText(formData, "lastName") : "",
    mode: modeValue,
  };

  if (options.includeName && (!input.firstName || !input.lastName)) {
    return invalidForm("Escribe tu nombre y apellido para confirmar la reserva.");
  }

  return { ok: true, input };
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateEventPages(eventId: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
}
