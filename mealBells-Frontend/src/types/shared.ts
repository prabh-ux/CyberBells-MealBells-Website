export type NavButtonProps = {
  label: string;
  path: string;
  icon: string;
  showLabel: boolean;
  isActive: boolean;
  onClick: (path: string) => void;
};