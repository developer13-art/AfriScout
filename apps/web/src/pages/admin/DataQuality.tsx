import { PageHeader } from "../../components/layout/PageHeader";
import { DataQualityPanel } from "../../components/admin/DataQualityPanel";
import { SeoHead } from "../../components/common/SeoHead";

export function DataQuality() {
  return (
    <>
      <SeoHead title="Data quality" />
      <PageHeader
        title="Data quality"
        description="Metrics about extraction completeness and validation."
      />
      <DataQualityPanel
        metrics={[
          {
            key: "extraction",
            label: "Extraction success",
            value: 98,
            target: 95,
          },
          {
            key: "requiredFields",
            label: "Required fields present",
            value: 96,
            target: 98,
          },
          {
            key: "duplicateRate",
            label: "Duplicate rate",
            value: 4,
            target: 5,
          },
          {
            key: "verification",
            label: "Verified sources",
            value: 92,
            target: 95,
          },
        ]}
      />
    </>
  );
}