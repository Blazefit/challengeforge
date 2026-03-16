import { getParticipantByToken } from "@/lib/participant";
import { notFound } from "next/navigation";
import Link from "next/link";
import IntakeForm from "./IntakeForm";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();

  const track = participant.tracks as { name: string; icon: string; color: string } | null;
  const intake = participant.intake_pre as Record<string, unknown> | null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4 border-b border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Intake Form</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span>{track?.icon}</span>
              <span className="font-bold text-sm" style={{ color: track?.color }}>{track?.name}</span>
            </div>
          </div>
          <Link href={`/dashboard/${token}`} className="text-gray-400 text-sm hover:text-white">&larr; Dashboard</Link>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        <IntakeForm
          token={token}
          participantId={participant.id}
          existingIntake={intake}
        />
      </div>
    </div>
  );
}
