"use client";

import { createContext, useContext } from "react";

type CourseContextValue = {
  currentCourseId: string | null;
  setCurrentCourse: (courseId: string | null) => void;
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({
  value,
  children,
}: {
  value: CourseContextValue;
  children: React.ReactNode;
}) {
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourseContext(): CourseContextValue {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseContext must be used inside CourseProvider");
  }
  return context;
}
