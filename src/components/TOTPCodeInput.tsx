import { ActionIcon, NumberInput } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { FocusEventHandler, useState } from "react";
import { ClipboardCopy, X } from "tabler-icons-react";

const TOTPCodeInput = (props: {
  error?: React.ReactNode;
  onBlur?: FocusEventHandler<HTMLInputElement> | undefined;
  onChange?: (value: number | undefined) => void;
  onFocus?: FocusEventHandler<HTMLInputElement> | undefined;
  value?: number | undefined;
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <NumberInput
      mt="sm"
      label="Code"
      required
      hideControls
      minLength={6}
      formatter={(v) => (copied ? v?.padStart(6, "0") : v) ?? ""}
      noClampOnBlur
      onKeyDownCapture={(e) => e.stopPropagation()}
      autoComplete="one-time-code"
      rightSection={
        <ActionIcon
          mr="sm"
          color="indigo"
          onClick={() => {
            navigator.clipboard.readText().then((text) => {
              if (text.length !== 6) throw new Error("Wrong length");
              const num = Number(text);
              if (Number.isNaN(num)) throw new Error("Not numbers");
              setCopied(true);
              props.onChange && props.onChange(num);
              // registForm.setFieldValue("pin", num);
            }).catch((err) =>
              showNotification({
                title: "Clipboard Error",
                message: err.message,
                icon: <X />,
                color: "red",
              })
            );
          }}
        >
          <ClipboardCopy />
        </ActionIcon>
      }
      {...props}
      onChange={(v) => {
        setCopied(false);
        props.onChange && props.onChange(v);
      }}
    />
  );
};

export default TOTPCodeInput;
