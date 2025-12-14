// app/admissions/page.tsx
// Purpose: Admission page with dynamic step renderer wrapped in AuthGuard

"use client";

import dynamic from "next/dynamic";
import AuthGuard from "@/app/components/AuthGuard";

// Dynamically import the multi-step form to ensure client-only rendering
const MultiStepAdmissionForm = dynamic(
  () => import("./components/steps/MultiStepAdmissionForm.tsx"),
  { ssr: false }
);

export default function AdmissionPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Student Admission
          </h1>
          <section className="bg-white shadow rounded-lg p-6">
            <MultiStepAdmissionForm />
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}

/* 
Design reasoning:
- AuthGuard ensures only logged-in users can access the page.
- Dynamic import prevents SSR issues for client-only forms.
- Centered, responsive container enhances readability.
- Shadowed white card separates form visually from background.

Structure:
- AuthGuard -> main layout
- Container -> max-width, padding
- Header -> centered, clear hierarchy
- Form section -> visually isolated with rounded card + shadow

Implementation guidance:
- Future features like notifications, breadcrumbs, or sidebars can be added inside the container.
- Styling keeps form responsive and visually distinct without extra wrapper logic.

Scalability insight:
- Supports dynamic step updates and store integration without page modifications.
- Easy to wrap additional components like modals or toast notifications.
*/
