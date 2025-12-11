// app/_test/useStudentStore.test.ts
import { act } from "@testing-library/react";
import { useStudentStore } from "@/app/store/useStudentStore.ts";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useStudentStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useStudentStore.getState().clearProfile();
    useStudentStore.getState().clearStudents();
    jest.clearAllMocks();
  });

  it("fetchProfile sets profile correctly", async () => {
    const fakeStudent = {
      id: "1",
      userId: "u1",
      name: "John Doe",
      email: "john@example.com",
      Class: { id: "c1", name: "Class 1" },
      Grade: { id: "g1", name: "Grade 1" },
    };
    mockedAxios.get.mockResolvedValueOnce({ data: { student: fakeStudent } });

    await act(async () => {
      await useStudentStore.getState().fetchProfile("1");
    });

    const state = useStudentStore.getState();
    expect(state.profile?.id).toBe("1");
    expect(state.profile?.className).toBe("Class 1");
    expect(state.profileErrors).toEqual([]);
    expect(state.loadingProfile).toBe(false);
  });

  it("clearProfile resets profile state", () => {
    act(() => {
      useStudentStore.getState().clearProfile();
    });

    const state = useStudentStore.getState();
    expect(state.profile).toBeNull();
    expect(state.profileErrors).toEqual([]);
  });

  it("fetchStudents sets students and pagination correctly", async () => {
    const fakeStudents = [
      {
        id: "1",
        userId: "u1",
        user: { firstName: "John", surname: "Doe", otherNames: "", email: "john@example.com" },
        Class: { id: "c1", name: "Class 1" },
        Grade: { id: "g1", name: "Grade 1" },
      },
      {
        id: "2",
        userId: "u2",
        user: { firstName: "Jane", surname: "Smith", otherNames: "", email: "jane@example.com" },
        Class: { id: "c2", name: "Class 2" },
        Grade: { id: "g2", name: "Grade 2" },
      },
    ];
    mockedAxios.get.mockResolvedValueOnce({
      data: { students: fakeStudents, pagination: { page: 1, perPage: 20, total: 2, totalPages: 1 } },
    });

    await act(async () => {
      await useStudentStore.getState().fetchStudents();
    });

    const state = useStudentStore.getState();
    expect(state.students.length).toBe(2);
    expect(state.students[0].name).toBe("John Doe");
    expect(state.pagination.total).toBe(2);
    expect(state.listErrors).toEqual([]);
    expect(state.loadingList).toBe(false);
  });

  it("clearStudents resets students state", () => {
    act(() => {
      useStudentStore.getState().clearStudents();
    });

    const state = useStudentStore.getState();
    expect(state.students).toEqual([]);
    expect(state.pagination).toEqual({ page: 1, perPage: 20, total: 0, totalPages: 1 });
    expect(state.listErrors).toEqual([]);
  });

  it("handles errors in fetchProfile gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      await useStudentStore.getState().fetchProfile("invalid-id");
    });

    const state = useStudentStore.getState();
    expect(state.profile).toBeNull();
    expect(state.profileErrors).toEqual(["Network error"]);
    expect(state.loadingProfile).toBe(false);
  });

  it("handles errors in fetchStudents gracefully", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      await useStudentStore.getState().fetchStudents();
    });

    const state = useStudentStore.getState();
    expect(state.students).toEqual([]);
    expect(state.listErrors).toEqual(["Network error"]);
    expect(state.loadingList).toBe(false);
  });
});
