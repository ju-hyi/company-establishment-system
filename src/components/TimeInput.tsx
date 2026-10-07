import { inputClass } from "./ui";
import { parseTime, sanitizeTimeTyping } from "../utils/time";

/**
 * 24시간제 시간 직접 입력칸. 값은 입력한 글자 그대로 들고 있다가
 * 칸을 벗어나면(blur) "HH:mm" 으로 맞춘다 — 930 → 09:30, 1830 → 18:30.
 * 해석할 수 없는 값(25:80 등)은 그대로 두고 빨간 테두리로 표시하며, 저장 단계에서 막는다.
 * 숫자 키패드(inputMode=numeric)에는 콜론이 없는 기기가 많아 숫자만 입력해도 되게 했다.
 */
interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export default function TimeInput({ value, onChange, placeholder = "09:30", ...rest }: TimeInputProps) {
  const invalid = value.trim() !== "" && parseTime(value) === null;
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(sanitizeTimeTyping(e.target.value))}
      onBlur={() => {
        const parsed = parseTime(value);
        if (parsed && parsed !== value) onChange(parsed);
      }}
      aria-invalid={invalid}
      aria-label={rest["aria-label"]}
      className={`${inputClass} font-mono tabular-nums ${invalid ? "!ring-2 !ring-rose-400" : ""}`}
    />
  );
}
