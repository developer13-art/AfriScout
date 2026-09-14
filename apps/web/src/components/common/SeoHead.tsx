import { useEffect } from "react";
import { applySeo, type SeoMeta } from "../../utils/seo";

export interface SeoHeadProps extends SeoMeta {}

export function SeoHead(props: SeoHeadProps) {
  useEffect(() => {
    applySeo(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.title, props.description, props.image, props.url, props.type]);

  return null;
}