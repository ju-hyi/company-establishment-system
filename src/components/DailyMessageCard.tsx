import { Pencil } from "lucide-react";
import CharacterSpeech, { CHARACTER_IMAGES } from "./CharacterSpeech";
import { Card, CardTitle } from "./ui";

/**
 * 오늘의 한마디 — 캐릭터(제공 이미지 1번)가 위, 그 아래 말풍선에 저장된 문구를 보여준다.
 * 문구 수정은 설정 페이지에서 한다.
 */

export const DEFAULT_DAILY_MESSAGE = "오늘도 조금씩 해내보자! 🌸";

interface DailyMessageCardProps {
  message: string | null;
  /** 없으면 수정 버튼을 숨긴다 (설정 페이지 미리보기) */
  onEdit?: () => void;
}

export default function DailyMessageCard({ message, onEdit }: DailyMessageCardProps) {
  const text = message?.trim() || DEFAULT_DAILY_MESSAGE;

  return (
    <Card className="flex flex-col">
      <CardTitle
        right={
          onEdit && (
            <button
              onClick={onEdit}
              className="rounded-md p-1 text-gray-300 transition hover:bg-gray-50 hover:text-rose-500"
              aria-label="오늘의 한마디 수정"
            >
              <Pencil size={14} />
            </button>
          )
        }
      >
        오늘의 한마디
      </CardTitle>

      <div className="flex min-h-0 flex-1 items-center">
        <div className="h-full w-full">
          <CharacterSpeech src={CHARACTER_IMAGES.dailyMessage} imageHeight={96} vertical>
            {text}
          </CharacterSpeech>
        </div>
      </div>
    </Card>
  );
}
