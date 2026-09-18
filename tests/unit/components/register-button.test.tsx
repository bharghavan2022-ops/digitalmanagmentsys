import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterButton } from "@/app/(volunteer)/events/[id]/register-button";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

describe("RegisterButton", () => {
  it("registers and refreshes on success", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={false}
        waitlisted={false}
        isFull={false}
        canCancel={false}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/events/event-1/register", { method: "POST" });
  });

  it("shows 'Join waitlist' label when the event is full", () => {
    render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={false}
        waitlisted={false}
        isFull={true}
        canCancel={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Join waitlist" })).toBeInTheDocument();
  });

  it("shows an error message and does not refresh when registration fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Already registered for this event" }),
    });

    render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={false}
        waitlisted={false}
        isFull={false}
        canCancel={false}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Already registered for this event")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("offers cancellation only when canCancel is true", () => {
    const { rerender } = render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={true}
        waitlisted={false}
        isFull={false}
        canCancel={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Cancel registration" })).not.toBeInTheDocument();

    rerender(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={true}
        waitlisted={false}
        isFull={false}
        canCancel={true}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel registration" })).toBeInTheDocument();
  });

  it("cancels via DELETE and refreshes on success", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({}) });

    render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={true}
        waitlisted={false}
        isFull={false}
        canCancel={true}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel registration" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/events/event-1/register", { method: "DELETE" });
  });

  it("shows waitlist status text when waitlisted", () => {
    render(
      <RegisterButton
        eventId="event-1"
        alreadyRegistered={true}
        waitlisted={true}
        isFull={false}
        canCancel={false}
      />,
    );
    expect(screen.getByText("You are on the waitlist for this event.")).toBeInTheDocument();
  });
});
