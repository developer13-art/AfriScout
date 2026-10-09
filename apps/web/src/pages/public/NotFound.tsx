import { NotFoundState } from "../../components/common/NotFoundState";
import { SeoHead } from "../../components/common/SeoHead";

export function NotFound() {
  return (
    <>
      <SeoHead title="Page not found" />
      <NotFoundState />
    </>
  );
}