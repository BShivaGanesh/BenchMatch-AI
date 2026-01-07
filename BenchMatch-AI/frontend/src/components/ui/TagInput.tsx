import React, { useState } from "react";
import type { KeyboardEvent } from "react";
import Button from "./Button";

interface TagInputProps {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
}) => {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) =>
    onChange(value.filter((t) => t !== tag));

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-700">{label}</label>
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-[color:var(--light-watermark)] bg-white px-2 py-1 focus-within:ring-2 focus-within:ring-[color:var(--light-watermark)]">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-[color:var(--light-watermark)]/20 px-2 py-0.5 text-[11px] text-[color:var(--ig-blue)]"
          >
            {tag}
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 border-none bg-transparent px-1 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none"
          placeholder={placeholder ?? "Type and press Enter"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-[11px]"
          onClick={() => addTag(input)}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default TagInput;
