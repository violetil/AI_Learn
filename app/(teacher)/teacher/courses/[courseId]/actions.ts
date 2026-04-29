"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { MaterialKind } from "../../../../../node_modules/.prisma/client/default";
import { requireRole } from "@/lib/authz";
import { getTeacherOwnedCourse } from "@/lib/course-access";
import { prisma } from "@/lib/db";

export async function createAssignmentAction(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");

  const courseId = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "on";

  if (!courseId) {
    redirect("/dashboard?section=library");
  }
  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    redirect("/dashboard?section=library");
  }
  if (!title) {
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  if (dueAtRaw && Number.isNaN(dueAt?.getTime())) {
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }

  await prisma.assignment.create({
    data: {
      courseId,
      creatorId: user.id,
      title,
      question: question || description || null,
      description: description || null,
      dueAt,
      published,
    },
  });

  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}

export async function createMaterialAction(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");

  const courseId = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? MaterialKind.DOCUMENT).trim();
  const url = String(formData.get("url") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const file = formData.get("file");

  if (!courseId) {
    redirect("/dashboard?section=library");
  }
  const course = await getTeacherOwnedCourse(user.id, courseId);
  if (!course) {
    redirect("/dashboard?section=library");
  }
  if (!title) {
    redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
  }

  const kind =
    kindRaw in MaterialKind
      ? (kindRaw as MaterialKind)
      : MaterialKind.DOCUMENT;

  let finalKind = kind;
  let finalUrl = url || null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
    }
    const safeExt = extname(file.name || "").slice(0, 10);
    const fileName = `${Date.now()}-${randomUUID()}${safeExt}`;
    const uploadsDir = join(process.cwd(), "public", "uploads", "materials");
    await mkdir(uploadsDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadsDir, fileName), Buffer.from(bytes));
    finalUrl = `/uploads/materials/${fileName}`;
    finalKind = MaterialKind.FILE;
  }

  await prisma.learningMaterial.create({
    data: {
      courseId,
      title,
      description: description || null,
      kind: finalKind,
      url: finalUrl,
      content: content || null,
    },
  });

  redirect(`/dashboard?section=library&courseId=${encodeURIComponent(courseId)}`);
}
