"use client";

import { useEffect, useState } from "react";
import { Plus, Settings, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ApplicantDetailModal } from "@/components/ApplicantDetailModal";
import { ApplicantsDataTable } from "@/components/applicants/table/ApplicantsDataTable";
import { columns } from "@/components/applicants/table/columns";
import { ActionCenter } from "@/components/applicants/ActionCenter";
import { Applicant } from "@/types/applicant";
import { Button } from "@/components/ui/button";

export default function ApplicantsPage() {
  // --- State for Server-Side Data ---
  const [data, setData] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  // Note: TanStack table uses 0-based index, API uses 1-based page usually. We'll map it.
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  // Sorting
  const [sorting, setSorting] = useState<any>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: 'ALL',
    locationId: 'ALL'
  });

  const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);

  // Modal State
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // --- Fetch Data ---
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      // Build Query String
      const params = new URLSearchParams();
      params.set("page", (pagination.pageIndex + 1).toString());
      params.set("limit", pagination.pageSize.toString());

      if (searchTerm) params.set("search", searchTerm);
      if (filters.status !== 'ALL') params.set("status", filters.status);
      if (filters.locationId !== 'ALL') params.set("locationId", filters.locationId);

      if (sorting.length > 0) {
        params.set("sort", sorting[0].id);
        params.set("order", sorting[0].desc ? "desc" : "asc");
      }

      const res = await fetch(`/api/applicants?${params.toString()}`);
      const result = await res.json();

      if (result.data) {
        setData(result.data);
        setPageCount(result.pagination.totalPages);
      } else {
        setData([]);
      }

      // Update modal data if open
      if (selectedApplicant) {
        const fresh = result.data?.find((a: Applicant) => a.id === selectedApplicant.id);
        if (fresh) setSelectedApplicant(fresh);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Locations ---
  useEffect(() => {
    fetch("/api/locations").then(res => res.json()).then(setLocations).catch(console.error);
  }, []);

  // --- Effect: Fetch on change ---
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchApplicants();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.pageIndex, pagination.pageSize, sorting, searchTerm, filters]);


  // --- Handlers ---
  const handleOpenModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedApplicant(null);
  };

  // Listen for event from Table Action (Dropdown)
  useEffect(() => {
    const handleDetailEvent = (e: any) => {
      handleOpenModal(e.detail);
    };
    document.addEventListener('open-applicant-modal', handleDetailEvent);
    return () => document.removeEventListener('open-applicant-modal', handleDetailEvent);
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المتقدمين</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة الطلبات، التذاكر، والاختبارات مركزياً</p>
        </div>
        <div className="flex gap-2">
          {/* Sync Button */}
          <button
            onClick={async () => {
              const btn = document.getElementById('sync-btn');
              if (btn) btn.classList.add('animate-spin');
              try {
                const res = await fetch('/api/automation/sync-emails', { method: 'POST' });
                const data = await res.json();
                alert(`تمت المزامنة بنجاح`); // Keeping simple alert or use Toast later
                fetchApplicants();
              } catch (e) {
                alert('فشل الاتصال');
              } finally {
                if (btn) btn.classList.remove('animate-spin');
              }
            }}
            className="ant-btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-10 w-10 flex items-center justify-center rounded-lg transition-colors"
            title="مزامنة الإيميل"
          >
            <RefreshCw id="sync-btn" className="h-4 w-4" />
          </button>

          <Link href="/applicants/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
              <Plus className="h-4 w-4" />
              متقدم جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Center */}
      <ActionCenter />

      {/* Main Table Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <ApplicantsDataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          locations={locations}
          loading={loading}
        />
      </div>

      {/* Detail Modal */}
      <ApplicantDetailModal
        applicant={selectedApplicant}
        open={modalOpen}
        onClose={handleCloseModal}
        onUpdate={fetchApplicants}
      />
    </div>
  );
}
