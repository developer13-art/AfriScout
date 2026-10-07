import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Compass, LockKeyhole, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { communityService, type CommunitySpace } from "../../services/community.service";

const categories = ["All groups", "Technology", "Web3", "AI", "Business", "Education", "Jobs", "Grants", "Hackathons", "Countries", "Universities", "Industries"];
const purposes = [
  ["LEARNING", "Learning"], ["NETWORKING", "Networking"], ["COLLABORATION", "Collaboration"],
  ["OPPORTUNITIES", "Opportunities"], ["JOBS", "Jobs"], ["HACKATHONS", "Hackathons"],
  ["GRANTS", "Grants"], ["WEB3", "Web3"], ["INDUSTRY", "Industry"], ["LOCATION", "Location"],
  ["ORGANIZATION", "Organization"], ["PROJECT", "Project"], ["RESEARCH", "Research"],
  ["GENERAL", "General Community"],
];
const visibilityOptions = [
  ["PUBLIC", "Public", "Anyone can discover and join immediately."],
  ["PRIVATE", "Private", "Discoverable; membership requires approval."],
  ["HIDDEN", "Hidden", "Only members and invited people can find it."],
] as const;

type Visibility = "PUBLIC" | "PRIVATE" | "HIDDEN";
type CreateForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  purpose: string;
  visibility: Visibility;
  countryCode: string;
  language: string;
  profileImageUrl: string;
  coverImageUrl: string;
  topicsText: string;
};

const initialForm: CreateForm = {
  name: "", slug: "", description: "", category: "Technology", purpose: "LEARNING",
  visibility: "PUBLIC", countryCode: "", language: "English", profileImageUrl: "",
  coverImageUrl: "", topicsText: "",
};

const slugify = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function GroupCard({ group, onJoin, joining }: { group: CommunitySpace; onJoin: (slug: string) => void; joining: boolean }) {
  return (
    <Card className="scout-group-card overflow-hidden">
      <div className="scout-group-card-cover" style={group.coverImageUrl ? { backgroundImage: `linear-gradient(90deg, rgb(4 19 31 / 35%), rgb(4 19 31 / 10%)), url("${group.coverImageUrl}")` } : undefined}>
        <span className="scout-group-card-logo">
          {group.profileImageUrl ? <img src={group.profileImageUrl} alt="" /> : <UsersRound aria-hidden />}
        </span>
        {group.visibility !== "PUBLIC" ? <Badge tone="neutral"><LockKeyhole className="mr-1 h-3 w-3" />{group.visibility.toLowerCase()}</Badge> : null}
      </div>
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-neutral-900">{group.name}</h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              {group.memberCount.toLocaleString()} members{group.countryCode ? ` · ${group.countryCode}` : ""} · {group.language}
            </p>
          </div>
          <Badge tone="neutral">{group.category}</Badge>
        </div>
        <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-5 text-neutral-500">
          {group.description ?? "A place to connect around shared Scout interests and opportunities."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.topics.slice(0, 4).map((topic) => <span key={topic} className="scout-topic-chip">{topic}</span>)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 pt-3">
          <Link to={`/community/groups/${encodeURIComponent(group.slug)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
            Open group <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {group.membershipStatus === "ACTIVE" ? <Badge tone="success">Joined</Badge> : group.membershipStatus === "PENDING" ? <Badge tone="neutral">Request pending</Badge> : (
            <Button size="sm" onClick={() => onJoin(group.slug)} loading={joining}>
              {group.visibility === "PRIVATE" ? "Request to join" : "Join"}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function CommunityGroups() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All groups");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(initialForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [step, setStep] = useState(0);
  const groups = useQuery({ queryKey: ["community-spaces"], queryFn: communityService.spaces });
  const create = useMutation({
    mutationFn: () => communityService.createSpace({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim(),
      category: form.category,
      purpose: form.purpose,
      visibility: form.visibility,
      countryCode: form.countryCode.trim().toUpperCase() || undefined,
      language: form.language.trim(),
      profileImageUrl: form.profileImageUrl.trim() || undefined,
      coverImageUrl: form.coverImageUrl.trim() || undefined,
      topics: [...new Set(form.topicsText.split(",").map((topic) => topic.trim()).filter(Boolean))],
    }),
    onSuccess: async (group) => {
      await client.invalidateQueries({ queryKey: ["community-spaces"] });
      setCreateOpen(false);
      setForm(initialForm);
      setStep(0);
      navigate(`/community/groups/${encodeURIComponent(group.slug)}`);
    },
  });
  const join = useMutation({
    mutationFn: communityService.joinSpace,
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-spaces"] }),
  });
  const visibleGroups = useMemo(() => (groups.data ?? []).filter((group) => {
    const matchesCategory = category === "All groups" || group.category.toLowerCase().includes(category.toLowerCase()) ||
      group.purpose.toLowerCase().includes(category.toLowerCase()) || group.topics.some((topic) => topic.toLowerCase().includes(category.toLowerCase()));
    const text = `${group.name} ${group.description ?? ""} ${group.category} ${group.topics.join(" ")}`.toLowerCase();
    return matchesCategory && text.includes(search.trim().toLowerCase());
  }), [groups.data, category, search]);

  const updateForm = <K extends keyof CreateForm>(key: K, value: CreateForm[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !slugManuallyEdited ? { slug: slugify(String(value)) } : {}),
    }));
  };
  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    create.mutate();
  };

  return (
    <div className="scout-community-page scout-groups-page">
      <SeoHead title="Scout groups" />
      <CommunitySubnav />
      <section className="scout-groups-hero">
        <div>
          <span className="scout-community-eyebrow">PEOPLE · OPPORTUNITIES · COLLABORATION</span>
          <h1>Find your people. Build what’s next.</h1>
          <p>Scout Groups bring people, opportunities, and projects together around what you care about.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Create group</Button>
      </section>
      <div className="scout-group-discovery">
        <div className="scout-group-discovery-heading">
          <div>
            <h2>Discover groups</h2>
            <p>Find a community around your interests, work, or next opportunity.</p>
          </div>
          <label className="scout-group-search">
            <Search aria-hidden className="h-4 w-4" />
            <span className="sr-only">Search groups</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search groups…" maxLength={100} />
          </label>
        </div>
        <div className="scout-group-categories" role="group" aria-label="Filter groups by category">
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? "is-selected" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </div>
      {groups.isLoading ? <Loader label="Finding Scout groups" /> : null}
      {groups.isError ? <Card><CardBody className="text-sm text-red-500">Groups could not be loaded. Please try again.</CardBody></Card> : null}
      {!groups.isLoading && !groups.isError && visibleGroups.length === 0 ? (
        <Card><CardBody className="p-9 text-center">
          <Compass className="mx-auto h-8 w-8 text-primary-700" />
          <h2 className="mt-3 font-semibold text-neutral-900">{search || category !== "All groups" ? "No groups match those filters" : "Start your first Scout group"}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">Create a focused community that connects people with opportunities, discussions, and collaboration.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Create group</Button>
        </CardBody></Card>
      ) : null}
      <div className="scout-groups-grid">
        {visibleGroups.map((group) => (
          <GroupCard key={group.id} group={group} onJoin={(slug) => join.mutate(slug)} joining={join.isPending} />
        ))}
      </div>
      {join.isError ? <p role="alert" className="mt-3 text-sm text-red-500">Could not update your group membership. Please try again.</p> : null}

      <Dialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setStep(0); create.reset(); }}
        title="Create a Scout Group"
        description="Build a focused community around people, opportunities, and collaboration."
        size="lg"
        panelClassName="scout-social-dialog scout-group-dialog"
      >
        <form onSubmit={submitCreate} className="space-y-5">
          <div className="scout-group-steps">
            {["Basic information", "Group type", "Purpose & topics", "Review"].map((label, index) => (
              <button type="button" key={label} onClick={() => index < step && setStep(index)} className={index <= step ? "is-current" : ""}>
                <span>{index + 1}</span>{label}
              </button>
            ))}
          </div>
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="scout-group-field sm:col-span-2">Group name
                <input required minLength={3} maxLength={80} value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Solana Developers Nigeria" />
              </label>
              <label className="scout-group-field sm:col-span-2">Group username
                <div className="scout-group-slug"><span>/community/groups/</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={64} value={form.slug} onChange={(event) => { setSlugManuallyEdited(true); setForm((current) => ({ ...current, slug: event.target.value })); }} placeholder="solana-dev-nigeria" /></div>
              </label>
              <label className="scout-group-field sm:col-span-2">Description
                <textarea required minLength={20} maxLength={1000} rows={3} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="A community for developers building, learning, and collaborating on Solana projects in Nigeria." />
              </label>
              <label className="scout-group-field">Category
                <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                  {["Technology", "Web3", "AI", "Business", "Education", "Jobs", "Grants", "Hackathons", "Countries", "Universities", "Industries", "Organization", "Project", "Research"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="scout-group-field">Country / region
                <input maxLength={2} value={form.countryCode} onChange={(event) => updateForm("countryCode", event.target.value)} placeholder="NG" />
              </label>
              <label className="scout-group-field">Language
                <input required minLength={2} maxLength={40} value={form.language} onChange={(event) => updateForm("language", event.target.value)} />
              </label>
              <label className="scout-group-field">Group image URL
                <input type="url" value={form.profileImageUrl} onChange={(event) => updateForm("profileImageUrl", event.target.value)} placeholder="https://…" />
              </label>
              <label className="scout-group-field sm:col-span-2">Cover image URL
                <input type="url" value={form.coverImageUrl} onChange={(event) => updateForm("coverImageUrl", event.target.value)} placeholder="https://…" />
              </label>
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-3">
              {visibilityOptions.map(([value, label, description]) => (
                <label key={value} className={`scout-group-visibility ${form.visibility === value ? "is-selected" : ""}`}>
                  <input type="radio" name="group-visibility" checked={form.visibility === value} onChange={() => updateForm("visibility", value)} />
                  <span><strong>{label}</strong><small>{description}</small></span>
                </label>
              ))}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <label className="scout-group-field">What is the group primarily for?
                <select value={form.purpose} onChange={(event) => updateForm("purpose", event.target.value)}>
                  {purposes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="scout-group-field">Topics and interests
                <input value={form.topicsText} onChange={(event) => updateForm("topicsText", event.target.value)} placeholder="Solana, Rust, Web3, Hackathons" />
                <small>Separate topics with commas. Add up to 12.</small>
              </label>
              <div className="scout-group-purpose-note"><Sparkles aria-hidden /><span>Purpose and topics help Scout connect your group with relevant people and opportunities.</span></div>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="scout-group-review">
              <div className="scout-group-review-cover" style={form.coverImageUrl ? { backgroundImage: `url("${form.coverImageUrl}")` } : undefined}>
                {form.profileImageUrl ? <img src={form.profileImageUrl} alt="" /> : <UsersRound aria-hidden />}
              </div>
              <h2>{form.name || "Your group name"}</h2>
              <p>scout/community/groups/{form.slug || "your-group"} · {form.visibility.toLowerCase()} · {form.category}</p>
              <p>{form.description || "Your group description will appear here."}</p>
              <div className="mt-3 flex flex-wrap gap-2">{form.topicsText.split(",").map((topic) => topic.trim()).filter(Boolean).map((topic) => <span className="scout-topic-chip" key={topic}>{topic}</span>)}</div>
            </div>
          ) : null}
          {create.isError ? <p role="alert" className="text-sm text-red-400">Group could not be created. Check the group username and try again.</p> : null}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <Button type="button" variant="outline" onClick={() => step ? setStep((current) => current - 1) : setCreateOpen(false)}> {step ? "Back" : "Cancel"} </Button>
            <Button type="submit" loading={create.isPending} disabled={step === 0 && (!form.name.trim() || !form.slug.trim() || form.description.trim().length < 20)}>
              {step === 3 ? "Create group" : "Next"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
