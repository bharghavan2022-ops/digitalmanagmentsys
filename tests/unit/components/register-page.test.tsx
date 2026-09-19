import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(public)/register/page";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const mocks = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signUp: mocks.signUp } }),
}));

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  mocks.signUp.mockReset();
});

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Full name"), "New Volunteer");
  await userEvent.type(screen.getByLabelText("Phone"), "9999999999");
  await userEvent.type(screen.getByLabelText("Department"), "CSE");
  await userEvent.click(screen.getByRole("button", { name: "Register" }));
}

describe("RegisterPage", () => {
  it("sends profile fields as signup metadata rather than a separate authenticated call", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    render(<RegisterPage />);

    await fillAndSubmit();

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      options: {
        data: {
          fullName: "New Volunteer",
          phone: "9999999999",
          department: "CSE",
          yearOfStudy: 1,
        },
      },
    });
    expect(push).toHaveBeenCalledWith("/post-login");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows a check-your-email state instead of erroring when signUp returns no session", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<RegisterPage />);

    await fillAndSubmit();

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the Supabase error message when signUp fails", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "User already registered" },
    });
    render(<RegisterPage />);

    await fillAndSubmit();

    expect(await screen.findByText("User already registered")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
