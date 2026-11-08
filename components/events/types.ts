export type EventSummary = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  timeZone: string;
  isActive: boolean;
  shareUrl: string;
  updatedAt: string;
};

export type BookingSummary = {
  id: string;
  firstName: string;
  lastName: string;
  startAt: string;
  endAt: string;
  status: "CONFIRMED" | "CANCELLED";
};

export type EventExceptionSummary = {
  id: string;
  date: string;
  kind: "OPEN" | "BLOCK";
  startMinute: number;
  endMinute: number;
};

export type TimeWindow = { startMinute: number; endMinute: number };

export type EventConfigPreview = Pick<EventSummary, "title" | "description" | "durationMinutes" | "startDate" | "endDate"> & {
  weekdays: boolean[];
  weeklyWindows: TimeWindow[];
};

export type EventDetailsProps = {
  event: EventSummary;
  weekdays: boolean[];
  weeklyWindows: TimeWindow[];
  exceptions: EventExceptionSummary[];
  bookings: BookingSummary[];
  month: string;
  selectedDate: string;
  today: string;
  now: string;
};
