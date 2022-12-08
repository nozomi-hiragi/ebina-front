import { ActionIcon, NumberInput, NumberInputProps } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useCallback, useState } from "react";
import { ClipboardCopy, X } from "tabler-icons-react";

const TOTPCodeInput = ({ onChange, ...props }: NumberInputProps) => {
  const [copied, setCopied] = useState(false);
  const onPasteCB = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      if (text.length !== 6) throw new Error("Wrong length");
      const num = Number(text);
      if (Number.isNaN(num)) throw new Error("Not numbers");
      setCopied(true);
      onChange && onChange(num);
    }).catch((err) =>
      showNotification({
        title: "Clipboard Error",
        message: err.message,
        icon: <X />,
        color: "red",
      })
    );
  }, [onChange]);
  const onInputChange = useCallback((v?: number) => {
    setCopied(false);
    onChange && onChange(v);
  }, [onChange]);
  return (
    <NumberInput
      label="Code"
      hideControls
      minLength={6}
      formatter={(v) => (copied ? v?.padStart(6, "0") : v) ?? ""}
      noClampOnBlur
      onKeyDownCapture={(e) => e.stopPropagation()}
      autoComplete="one-time-code"
      rightSection={
        <ActionIcon mr="sm" color="indigo" onClick={onPasteCB}>
          <ClipboardCopy />
        </ActionIcon>
      }
      {...props}
      onChange={onInputChange}
    />
  );
};

export default TOTPCodeInput;
