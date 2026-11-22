"use client";

import { cn } from "cn";
import {
  Clock,
  Edit2,
  Filter,
  Plus,
  Power,
  PowerOff,
  Scissors,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DeleteServiceDialog } from "@/components/admin/DeleteServiceDialog";
import { ServiceFormDialog } from "@/components/admin/ServiceFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toggleServiceStatus } from "@/lib/actions/services";
import {
  SERVICE_CATEGORIES,
  type Service,
  type ServiceStatus,
} from "@/types/service";

interface ServicesManagementClientProps {
  initialServices: Service[];
}

export function ServicesManagementClient({
  initialServices,
}: ServicesManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Filtered services
  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      // Status filter
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "all" && service.category !== selectedCategory) {
        return false;
      }
      // Search query (case-insensitive)
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = service.serviceName.toLowerCase().includes(query);
        const matchesDesc = service.description.toLowerCase().includes(query);
        const matchesCat = service.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [initialServices, search, selectedCategory, statusFilter]);

  const activeCount = initialServices.filter(
    (s) => s.status === "active",
  ).length;
  const inactiveCount = initialServices.filter(
    (s) => s.status === "inactive",
  ).length;

  const handleOpenAdd = () => {
    setServiceToEdit(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setServiceToEdit(service);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (service: Service) => {
    const nextStatus: ServiceStatus =
      service.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      try {
        await toggleServiceStatus(service._id, nextStatus);
        toast.success(
          `Service "${service.serviceName}" is now ${nextStatus === "active" ? "Active (visible to public)" : "Inactive (hidden)"}.`,
        );
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status.",
        );
      }
    });
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
            Manage Salon Services
          </h1>
          <p className="text-sm text-fg-muted">
            Create, update, activate, and deactivate services for the Velvet
            Saloon catalog.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium shrink-0"
        >
          <Plus className="size-4 mr-1.5" aria-hidden />
          Add New Service
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border-subtle bg-bg-surface-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Total Services
            </CardTitle>
            <Scissors className="size-4 text-bg-accent-brand" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-primary">
              {initialServices.length}
            </div>
            <CardDescription className="text-xs text-fg-muted mt-1">
              All catalog services
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-border-subtle bg-bg-surface-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Active Services
            </CardTitle>
            <Power className="size-4 text-emerald-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {activeCount}
            </div>
            <CardDescription className="text-xs text-fg-muted mt-1">
              Publicly visible and bookable
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-border-subtle bg-bg-surface-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Inactive Services
            </CardTitle>
            <PowerOff className="size-4 text-fg-muted" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fg-muted">
              {inactiveCount}
            </div>
            <CardDescription className="text-xs text-fg-muted mt-1">
              Hidden from public storefront
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search services by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-fg-muted" aria-hidden />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-border-subtle bg-bg-surface-card px-2.5 py-1.5 text-xs text-fg-primary outline-none focus:border-border-focus"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex rounded-lg border border-border-subtle p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                statusFilter === "all"
                  ? "bg-bg-accent-brand text-fg-on-accent font-medium"
                  : "text-fg-muted hover:text-fg-primary",
              )}
            >
              All ({initialServices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                statusFilter === "active"
                  ? "bg-bg-accent-brand text-fg-on-accent font-medium"
                  : "text-fg-muted hover:text-fg-primary",
              )}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                statusFilter === "inactive"
                  ? "bg-bg-accent-brand text-fg-on-accent font-medium"
                  : "text-fg-muted hover:text-fg-primary",
              )}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Services Table / Cards */}
      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-bg-surface-card p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-canvas text-fg-muted mb-4">
            <Scissors className="size-6" aria-hidden />
          </div>
          <h3 className="text-lg font-semibold text-fg-primary">
            {initialServices.length === 0
              ? "No services created yet"
              : "No matching services found"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-fg-muted">
            {initialServices.length === 0
              ? "Get started by adding your first salon service with custom duration, pricing, and image."
              : "Try adjusting your search terms or filters to find the service you are looking for."}
          </p>
          {initialServices.length === 0 ? (
            <Button
              onClick={handleOpenAdd}
              className="mt-4 bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
            >
              <Plus className="size-4 mr-1.5" aria-hidden />
              Add First Service
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-bg-canvas/50 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">
                    Service
                  </th>
                  <th scope="col" className="px-4 py-3 hidden md:table-cell">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                    Duration
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredServices.map((service) => {
                  const isActive = service.status === "active";
                  return (
                    <tr
                      key={service._id}
                      className="transition-colors hover:bg-bg-canvas/40"
                    >
                      {/* Service Details with Thumbnail */}
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-canvas">
                            <Image
                              src={service.image}
                              alt={service.serviceName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-fg-primary">
                              {service.serviceName}
                            </p>
                            <p className="line-clamp-1 max-w-xs text-xs text-fg-muted">
                              {service.description}
                            </p>
                            <span className="mt-1 inline-block text-[11px] text-fg-muted md:hidden">
                              {service.category} • {service.duration} mins
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal border-border-subtle"
                        >
                          {service.category}
                        </Badge>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-semibold text-fg-primary">
                        ${service.price.toFixed(2)}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 hidden sm:table-cell text-fg-muted">
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="size-3.5" aria-hidden />
                          {service.duration} mins
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(service)}
                          disabled={isPending}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:border-border-focus",
                            isActive
                              ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                              : "bg-fg-muted/15 text-fg-muted hover:bg-fg-muted/25",
                          )}
                          title={`Click to ${isActive ? "deactivate" : "activate"} service`}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isActive ? "bg-emerald-600" : "bg-fg-muted",
                            )}
                            aria-hidden
                          />
                          <span>{isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(service)}
                            title="Edit Service"
                            aria-label={`Edit ${service.serviceName}`}
                            className="text-fg-muted hover:text-fg-primary hover:bg-bg-canvas"
                          >
                            <Edit2 className="size-4" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenDelete(service)}
                            title="Delete Service"
                            aria-label={`Delete ${service.serviceName}`}
                            className="text-fg-muted hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Service Dialog */}
      <ServiceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        serviceToEdit={serviceToEdit}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteServiceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        service={serviceToDelete}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
