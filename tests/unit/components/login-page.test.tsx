import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(public)/login/page";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  resend: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, resend: mocks.resend },
  }),
}));

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  mocks.signInWithPassword.mockReset();
  mocks.resend.mockReset();
});

async function fillAndSubmit(email = "a@example.com", password = "password123") {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  it("redirects to /post-login on success", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginPage />);

    await fillAndSubmit();

    expect(push).toHaveBeenCalledWith("/post-login");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows the raw error message for wrong credentials", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    render(<LoginPage />);

    await fillAndSubmit();

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("offers to resend the confirmation email instead of a raw error when the account is unconfirmed", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: { message: "Email not confirmed" },
    });
    render(<LoginPage />);

    await fillAndSubmit("unconfirmed@example.com");

    expect(screen.queryByText("Email not confirmed")).not.toBeInTheDocument();
    const resendButton = await screen.findByRole("button", { name: "Resend confirmation email" });

    mocks.resend.mockResolvedValue({ error: null });
    await userEvent.click(resendButton);

    expect(mocks.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "unconfirmed@example.com",
    });
    expect(await screen.findByRole("button", { name: "Confirmation email resent" })).toBeInTheDocument();
  });
});
