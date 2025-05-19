import { EmojiPicker as BasePicker } from "@ferrucc-io/emoji-picker";

interface EmojiPickerProps {
  className?: string;
  emojisPerRow?: number;
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

type EmojiPickerComponent = React.FC<EmojiPickerProps> & {
  Header: typeof BasePicker.Header;
  Input: typeof BasePicker.Input;
  Group: typeof BasePicker.Group;
  List: typeof BasePicker.List;
};

const EmojiPicker = Object.assign(
  function EmojiPicker({
    className,
    emojisPerRow,
    onEmojiSelect,
    children,
  }: EmojiPickerProps) {
    return (
      <BasePicker
        className={className}
        emojisPerRow={emojisPerRow}
        onEmojiSelect={onEmojiSelect}
      >
        {children}
      </BasePicker>
    );
  },
  {
    Header: BasePicker.Header,
    Input: BasePicker.Input,
    Group: BasePicker.Group,
    List: BasePicker.List,
  },
) as EmojiPickerComponent;

export { EmojiPicker };
