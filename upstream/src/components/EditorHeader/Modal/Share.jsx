import { useTranslation } from "react-i18next";

export default function Share() {
  const { t } = useTranslation();
  return <div className="py-2">{t("device_only_notice")}</div>;
}
