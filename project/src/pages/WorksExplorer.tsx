import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/format';
import {
  Card,
  RiskBadge,
  Spinner,
  PageHeader,
  EmptyState,
} from '@/components/ui';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

interface WorksExplorerProps {
  onSelectWork: (workId: string) => void;
}

interface Work {
  work_id: string;
  work_title: string;
  state: string;
  mp_name: string;
  lifecycle_stage: string;
  san_sanction_amount: number | null;
  risk_score: number;
  risk_tier: string;
  status_group: string;
  san_work_status: string;
  rec_recommended_date: string;
  san_sanction_date: string;
  comp_completion_date: string;
  work_category: string;
  work_description: string;
}

const API_BASE = 'http://127.0.0.1:8000';
const PAGE_SIZE = 15;

function getValue(row: any, keys: string[]): any {
  for (const key of keys) {
    if (
      row &&
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim() !== ''
    ) {
      return row[key];
    }
  }

  return null;
}

/*
 * Determine the lifecycle stage correctly.
 *
 * Priority:
 * 1. Explicit Completed evidence
 * 2. Explicit Sanctioned evidence
 * 3. Explicit lifecycle value
 * 4. Recommendation
 *
 * Important:
 * "Work partially Completed" should NOT be treated
 * as fully Completed just because the word "Completed" appears.
 */
function getLifecycleStage(row: any): string {
  const statusGroup = String(
    getValue(row, [
      'status_group',
      'Status Group',
      'Status_Group',
    ]) ?? ''
  ).trim().toLowerCase();

  const workStatus = String(
    getValue(row, [
      'san_work_status',
      'San Work Status',
      'San_Work_Status',
    ]) ?? ''
  ).trim().toLowerCase();

  const completionDate = getValue(row, [
    'comp_completion_date',
    'Comp Completion Date',
    'Comp_Completion_Date',
    'completion_date',
    'Completion Date',
  ]);

  const sanctionDate = getValue(row, [
    'san_sanction_date',
    'Sanction Date',
    'San_Sanction_Date',
  ]);

  const explicitLifecycle = String(
    getValue(row, [
      'lifecycle_stage',
      'Lifecycle Stage',
      'Lifecycle_Stage',
    ]) ?? ''
  ).trim();

  /*
   * COMPLETED
   *
   * A completion date is the strongest evidence.
   */
  if (completionDate) {
    return 'Completed';
  }

  /*
   * Check exact/strong completed statuses.
   *
   * Do NOT simply use includes("complete"), because
   * "Work partially Completed" is not the same as
   * "Work Completed".
   */
  if (
    workStatus === 'work completed' ||
    workStatus === 'completed' ||
    workStatus === 'complete'
  ) {
    return 'Completed';
  }

  if (
    statusGroup === 'completed' ||
    statusGroup === 'complete'
  ) {
    return 'Completed';
  }

  /*
   * SANCTIONED
   */
  if (
    workStatus.includes('sanction') ||
    workStatus.includes('ongoing') ||
    workStatus === 'in progress' ||
    workStatus === 'progress'
  ) {
    return 'Sanctioned';
  }

  if (
    statusGroup.includes('sanction') ||
    statusGroup.includes('ongoing') ||
    statusGroup === 'in progress' ||
    statusGroup === 'progress'
  ) {
    return 'Sanctioned';
  }

  if (sanctionDate) {
    return 'Sanctioned';
  }

  /*
   * Use explicit lifecycle only after checking
   * the actual completion/sanction evidence.
   */
  if (explicitLifecycle) {
    const normalized = explicitLifecycle.toLowerCase();

    if (
      normalized === 'completed' ||
      normalized === 'complete'
    ) {
      return 'Completed';
    }

    if (
      normalized === 'sanctioned' ||
      normalized === 'sanction' ||
      normalized === 'in progress'
    ) {
      return 'Sanctioned';
    }

    if (normalized === 'recommended') {
      return 'Recommended';
    }
  }

  /*
   * Final fallback.
   */
  return 'Recommended';
}

function normalizeWork(row: any): Work {
  const riskScoreValue = getValue(row, [
    'risk_score',
    'Risk Score',
    'Risk_Score',
  ]);

  const sanctionAmountValue = getValue(row, [
    'san_sanction_amount',
    'Sanction Amount',
    'San_Sanction_Amount',
  ]);

  return {
    work_id: String(
      getValue(row, [
        'work_id',
        'Work ID',
        'Work_ID',
        'id',
        'ID',
      ]) ?? ''
    ),

    work_title: String(
      getValue(row, [
        'work_title',
        'Work Title',
        'Work_Title',
      ]) ?? ''
    ),

    state: String(
      getValue(row, [
        'State',
        'state',
      ]) ?? ''
    ),

    mp_name: String(
      getValue(row, [
        'mp_name',
        'MP Name',
        'MP_Name',
      ]) ?? ''
    ),

    lifecycle_stage: getLifecycleStage(row),

    san_sanction_amount:
      sanctionAmountValue !== null &&
      !Number.isNaN(Number(sanctionAmountValue))
        ? Number(sanctionAmountValue)
        : null,

    risk_score:
      riskScoreValue !== null &&
      !Number.isNaN(Number(riskScoreValue))
        ? Number(riskScoreValue)
        : 0,

    risk_tier: String(
      getValue(row, [
        'risk_tier',
        'Risk Tier',
        'Risk_Tier',
      ]) ?? 'Low'
    ),

    status_group: String(
      getValue(row, [
        'status_group',
        'Status Group',
        'Status_Group',
      ]) ?? ''
    ),

    san_work_status: String(
      getValue(row, [
        'san_work_status',
        'San Work Status',
        'San_Work_Status',
      ]) ?? ''
    ),

    rec_recommended_date: String(
      getValue(row, [
        'rec_recommended_date',
        'Recommended Date',
        'Rec Recommended Date',
        'Rec_Recommended_Date',
      ]) ?? ''
    ),

    san_sanction_date: String(
      getValue(row, [
        'san_sanction_date',
        'Sanction Date',
        'San_Sanction_Date',
      ]) ?? ''
    ),

    comp_completion_date: String(
      getValue(row, [
        'comp_completion_date',
        'Completion Date',
        'Comp_Completion_Date',
      ]) ?? ''
    ),

    work_category: String(
      getValue(row, [
        'work_category',
        'Work Category',
        'Work_Category',
      ]) ?? ''
    ),

    work_description: String(
      getValue(row, [
        'work_description',
        'Work Description',
        'Work_Description',
      ]) ?? ''
    ),
  };
}

function sortWorks(
  input: Work[],
  sortBy: string,
  sortDir: 'asc' | 'desc'
): Work[] {
  const result = [...input];

  result.sort((a: Work, b: Work) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    if (sortBy === 'risk_score') {
      aValue = a.risk_score;
      bValue = b.risk_score;
    } else if (sortBy === 'san_sanction_amount') {
      aValue = a.san_sanction_amount ?? 0;
      bValue = b.san_sanction_amount ?? 0;
    } else if (sortBy === 'rec_recommended_date') {
      aValue = a.rec_recommended_date;
      bValue = b.rec_recommended_date;
    }

    if (aValue < bValue) {
      return sortDir === 'asc' ? -1 : 1;
    }

    if (aValue > bValue) {
      return sortDir === 'asc' ? 1 : -1;
    }

    return 0;
  });

  return result;
}

export default function WorksExplorer({
  onSelectWork,
}: WorksExplorerProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const [searchInput, setSearchInput] =
    useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [stateFilter, setStateFilter] =
    useState<string>('');
  const [riskFilter, setRiskFilter] =
    useState<string>('');
  const [lifecycleFilter, setLifecycleFilter] =
    useState<string>('');

  const [sortBy, setSortBy] =
    useState<string>('risk_score');

  const [sortDir, setSortDir] =
    useState<'asc' | 'desc'>('desc');

  const [states, setStates] =
    useState<string[]>([]);

  /*
   * Load states.
   */
  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/states`
        );

        if (!response.ok) {
          throw new Error(
            `States API error: ${response.status}`
          );
        }

        const result = await response.json();

        let stateList: any[] = [];

        if (Array.isArray(result)) {
          stateList = result;
        } else if (Array.isArray(result?.states)) {
          stateList = result.states;
        } else if (Array.isArray(result?.data)) {
          stateList = result.data;
        }

        setStates(
          stateList
            .filter(
              (state) =>
                state !== null &&
                state !== undefined &&
                String(state).trim() !== ''
            )
            .map((state) => String(state))
            .sort((a, b) =>
              a.localeCompare(b)
            )
        );
      } catch (error) {
        console.error(
          'Failed to load states:',
          error
        );
        setStates([]);
      }
    };

    loadStates();
  }, []);

  /*
   * Load works from FastAPI.
   */
  const loadWorks = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set('page', String(page + 1));
      params.set('limit', String(PAGE_SIZE));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (stateFilter) {
        params.set('state', stateFilter);
      }

      if (riskFilter) {
        params.set('risk', riskFilter);
      }

      /*
       * Send lifecycle to backend.
       */
      if (lifecycleFilter) {
        params.set(
          'lifecycle',
          lifecycleFilter
        );
      }

      params.set('sort_by', sortBy);
      params.set('sort_dir', sortDir);

      const response = await fetch(
        `${API_BASE}/works?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Works API error: ${response.status}`
        );
      }

      const result = await response.json();

      const rawData: any[] = Array.isArray(
        result?.data
      )
        ? result.data
        : [];

      const normalizedWorks: Work[] =
        rawData.map((row: any) =>
          normalizeWork(row)
        );

      setWorks(normalizedWorks);

      setTotal(
        Number(result?.total) || 0
      );
    } catch (error) {
      console.error(
        'Failed to load works:',
        error
      );

      setWorks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    stateFilter,
    riskFilter,
    lifecycleFilter,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStateFilter('');
    setRiskFilter('');
    setLifecycleFilter('');
    setSortBy('risk_score');
    setSortDir('desc');
    setPage(0);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(stateFilter) ||
    Boolean(riskFilter) ||
    Boolean(lifecycleFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Works Explorer"
        subtitle={`${total.toLocaleString(
          'en-IN'
        )} works in the MPLADS database`}
      />

      <Card className="mb-4">
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Search by work ID, title, MP name, or description..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />

            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(
                  e.target.value
                );
                setPage(0);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                All States
              </option>

              {states.map((state) => (
                <option
                  key={state}
                  value={state}
                >
                  {state}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(
                  e.target.value
                );
                setPage(0);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                All Risk Levels
              </option>

              <option value="High">
                High Risk
              </option>

              <option value="Medium">
                Medium Risk
              </option>

              <option value="Low">
                Low Risk
              </option>
            </select>

            <select
              value={lifecycleFilter}
              onChange={(e) => {
                setLifecycleFilter(
                  e.target.value
                );
                setPage(0);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                All Stages
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Sanctioned">
                Sanctioned
              </option>

              <option value="Recommended">
                Recommended
              </option>
            </select>

            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const value =
                  e.target.value;

                if (
                  value ===
                  'risk_score-desc'
                ) {
                  setSortBy('risk_score');
                  setSortDir('desc');
                } else if (
                  value ===
                  'risk_score-asc'
                ) {
                  setSortBy('risk_score');
                  setSortDir('asc');
                } else if (
                  value ===
                  'san_sanction_amount-desc'
                ) {
                  setSortBy(
                    'san_sanction_amount'
                  );
                  setSortDir('desc');
                } else if (
                  value ===
                  'san_sanction_amount-asc'
                ) {
                  setSortBy(
                    'san_sanction_amount'
                  );
                  setSortDir('asc');
                } else if (
                  value ===
                  'rec_recommended_date-desc'
                ) {
                  setSortBy(
                    'rec_recommended_date'
                  );
                  setSortDir('desc');
                } else {
                  setSortBy(
                    'rec_recommended_date'
                  );
                  setSortDir('asc');
                }

                setPage(0);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="risk_score-desc">
                Risk: High to Low
              </option>

              <option value="risk_score-asc">
                Risk: Low to High
              </option>

              <option value="san_sanction_amount-desc">
                Amount: High to Low
              </option>

              <option value="san_sanction_amount-asc">
                Amount: Low to High
              </option>

              <option value="rec_recommended_date-desc">
                Date: Newest
              </option>

              <option value="rec_recommended_date-asc">
                Date: Oldest
              </option>
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2 py-1.5"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : works.length === 0 ? (
        <EmptyState message="No works found matching your filters" />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">
                      Work ID
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Title
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      State
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      MP
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Stage
                    </th>

                    <th className="text-right px-4 py-3 font-medium">
                      Sanctioned
                    </th>

                    <th className="text-center px-4 py-3 font-medium">
                      Risk
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {works.map(
                    (work: Work) => (
                      <tr
                        key={work.work_id}
                        onClick={() =>
                          onSelectWork(
                            work.work_id
                          )
                        }
                        className="border-b border-slate-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {work.work_id}
                        </td>

                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                          {work.work_title ||
                            '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {work.state || '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {work.mp_name || '—'}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              work.lifecycle_stage ===
                              'Completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : work.lifecycle_stage ===
                                    'Sanctioned'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {work.lifecycle_stage ||
                              '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right text-slate-700 text-xs">
                          {formatCurrency(
                            work.san_sanction_amount
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">
                              {work.risk_score}
                            </span>

                            <RiskBadge
                              tier={
                                work.risk_tier
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Showing{' '}
              {total === 0
                ? 0
                : page * PAGE_SIZE + 1}
              –
              {Math.min(
                (page + 1) * PAGE_SIZE,
                total
              )}{' '}
              of{' '}
              {total.toLocaleString(
                'en-IN'
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      0,
                      current - 1
                    )
                  )
                }
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <span className="text-sm text-slate-600 px-2">
                {page + 1} /{' '}
                {totalPages}
              </span>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages - 1,
                      current + 1
                    )
                  )
                }
                disabled={
                  page >=
                  totalPages - 1
                }
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}