import type { OpportunityFilters } from "../../types/opportunity";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";
import { opportunityCategories, opportunityTypes } from "../../config/categories";
import { africanCountries } from "../../config/countries";

export interface OpportunityFilterPanelProps {
  value: OpportunityFilters;
  onChange: (next: OpportunityFilters) => void;
  onReset: () => void;
}

export function OpportunityFilterPanel({
  value,
  onChange,
  onReset,
}: OpportunityFilterPanelProps) {
  const update = <K extends keyof OpportunityFilters>(
    key: K,
    next: OpportunityFilters[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <Select
        label="Category"
        placeholder="All categories"
        value={value.category ?? ""}
        onChange={(e) =>
          update(
            "category",
            (e.target.value || undefined) as OpportunityFilters["category"],
          )
        }
        options={opportunityCategories.map((c) => ({
          value: c.value,
          label: c.label,
        }))}
      />

      <Select
        label="Opportunity type"
        placeholder="All types"
        value={value.opportunityType ?? ""}
        onChange={(e) =>
          update(
            "opportunityType",
            (e.target.value || undefined) as OpportunityFilters["opportunityType"],
          )
        }
        options={opportunityTypes.map((t) => ({
          value: t.value,
          label: t.label,
        }))}
      />

      <Select
        label="Country"
        placeholder="All countries"
        value={value.countryCode ?? ""}
        onChange={(e) => update("countryCode", e.target.value || undefined)}
        options={africanCountries.map((c) => ({
          value: c.code,
          label: c.name,
        }))}
      />

      <Input
        label="City"
        placeholder="Any city"
        value={value.city ?? ""}
        onChange={(e) => update("city", e.target.value || undefined)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Value min"
          inputMode="numeric"
          value={value.minValue ?? ""}
          onChange={(e) =>
            update(
              "minValue",
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
        />
        <Input
          label="Value max"
          inputMode="numeric"
          value={value.maxValue ?? ""}
          onChange={(e) =>
            update(
              "maxValue",
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
        />
      </div>

      <Input
        label="Deadline before"
        type="date"
        value={value.deadlineBefore ?? ""}
        onChange={(e) => update("deadlineBefore", e.target.value || undefined)}
      />

      <Switch
        label="Remote only"
        checked={Boolean(value.isRemote)}
        onChange={(e) => update("isRemote", e.target.checked)}
      />

      <Button variant="outline" fullWidth onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}