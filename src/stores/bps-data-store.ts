import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useCallback, useRef } from "react";

// Types
interface SelectOption {
  value: string;
  label: string;
}

interface DomainItem {
  domain_id: string;
  domain_name: string;
}

interface VariableItem {
  var_id: string;
  title: string;
}

type BPSItem = { val: string; label: string; };

interface TahunItem extends BPSItem {
  th_id: string;
  th_name: string;
}

type TurtahunItem = BPSItem;
type VervarItem = BPSItem;

interface TurvarItem {
  val: number;
  label: string;
}

interface FetchedData {
  var: any;
  turvar: TurvarItem[];
  vervar: VervarItem[];
  tahun: TahunItem[];
  turtahun: TurtahunItem[];
  datacontent: Record<string, string>;
}

interface BPSDataState {
  // Configuration
  bpsKey: string;

  // Domain data
  domainList: SelectOption[];
  selectedDomain: string | null;

  // Variable data
  variableList: SelectOption[];
  selectedVariable: string | null;

  // Results data
  fetchedData: FetchedData | null;

  // Loading states
  isLoading: boolean; // Loading domains
  isFetching: boolean; // Fetching search results
  pulse: boolean; // Animation state

  // Progressive loading states
  totalVariablePages: number;
  loadedVariablePages: number;
  isVariableLoadingComplete: boolean;

  // Search cache
  variableSearchCache: Map<string, SelectOption[]>;
}

interface BPSDataActions {
  // Actions
  setBpsKey: (key: string) => void;
  setDomainList: (domains: SelectOption[]) => void;
  setSelectedDomain: (domain: string | null) => void;
  setVariableList: (variables: SelectOption[]) => void;
  setSelectedVariable: (variable: string | null) => void;
  setFetchedData: (data: FetchedData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFetching: (fetching: boolean) => void;
  setPulse: (pulse: boolean) => void;

  // Progressive loading actions
  setTotalVariablePages: (pages: number) => void;
  setLoadedVariablePages: (pages: number) => void;
  setIsVariableLoadingComplete: (complete: boolean) => void;

  // Search cache actions
  setVariableSearchCache: (cache: Map<string, SelectOption[]>) => void;
  updateVariableSearchCache: (key: string, value: SelectOption[]) => void;

  // Reset actions
  resetVariableData: () => void;
  resetAllData: () => void;

  // Complex actions (from API calls)
  fetchAllDomains: () => Promise<void>;
  fetchInitialVariables: () => Promise<SelectOption[]>;
  fetchVariableData: () => Promise<void>;
  searchDomains: (query: string, signal?: AbortSignal) => Promise<SelectOption[]>;
  searchVariables: (query: string, signal?: AbortSignal) => Promise<SelectOption[]>;
  exportToExcel: () => void;
}

const BPS_API_KEY = "3405ac46a7c9419e06ebc7a9894b79fd";
const INITIAL_VARIABLE_PAGE_LOAD = 3;
const BACKGROUND_VARIABLE_CHUNK_SIZE = 5;

const transformVariableItems = (items: VariableItem[]): SelectOption[] =>
  items.map(({ var_id, title }) => ({
    value: var_id,
    label: title,
  }));

const fetchVariablePagesRange = async (
  domain: string,
  startPage: number,
  endPage: number,
  key: string,
  signal?: AbortSignal
): Promise<SelectOption[]> => {
  if (!domain || !key || startPage > endPage) return [];

  try {
    const pagePromises = Array.from(
      { length: endPage - startPage + 1 },
      (_, idx) =>
        fetch(
          `https://webapi.bps.go.id/v1/api/list/model/var/domain/${domain}/page/${startPage + idx}/key/${key}`,
          signal ? { signal } : {}
        ).then((res) => res.json())
    );

    const responses = await Promise.all(pagePromises);
    const allVariables: VariableItem[] = responses.flatMap((res) => res.data?.[1] || []);
    return transformVariableItems(allVariables);
  } catch (error) {
    console.error("[fetchVariablePagesRange] Error:", error);
    return [];
  }
};

const initialState: BPSDataState = {
  bpsKey: BPS_API_KEY,
  domainList: [],
  selectedDomain: null,
  variableList: [],
  selectedVariable: null,
  fetchedData: null,
  isLoading: true,
  isFetching: false,
  pulse: false,
  totalVariablePages: 0,
  loadedVariablePages: 0,
  isVariableLoadingComplete: false,
  variableSearchCache: new Map(),
};

// Helper functions
const loadVariablesPaginated = async (
  domain: string,
  pages: number,
  searchQuery?: string,
  signal?: AbortSignal
): Promise<SelectOption[]> => {
  if (!domain || !BPS_API_KEY) return [];

  try {
    const pageCountResponse = await fetch(
      `https://webapi.bps.go.id/v1/api/list/model/var/domain/${domain}/key/${BPS_API_KEY}`,
      signal ? { signal } : {}
    );
    const pageCountRes = await pageCountResponse.json();
    const totalPages = pageCountRes.data?.[0]?.pages || 0;

    const pagesToLoad = Math.min(pages, totalPages);

    const pagePromises = Array.from({ length: pagesToLoad }, (_, i) =>
      fetch(
        `https://webapi.bps.go.id/v1/api/list/model/var/domain/${domain}/page/${i + 1}/key/${BPS_API_KEY}`,
        signal ? { signal } : {}
      ).then(res => res.json())
    );

    const responses = await Promise.all(pagePromises);
    let allVariables: VariableItem[] = responses.flatMap(res => res.data?.[1] || []);

    let transformed = transformVariableItems(allVariables);

    // Apply search filter if provided
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      transformed = transformed.filter(opt =>
        opt.label.toLowerCase().includes(queryLower)
      );
    }

    return transformed;
  } catch (error) {
    console.error('[loadVariablesPaginated] Error:', error);
    return [];
  }
};

export const useBPSDataStore = create<BPSDataState & BPSDataActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setBpsKey: (key) => set({ bpsKey: key }, false, "setBpsKey"),
      setDomainList: (domains) => set({ domainList: domains }, false, "setDomainList"),
      setSelectedDomain: (domain) => set({ selectedDomain: domain }, false, "setSelectedDomain"),
      setVariableList: (variables) => set({ variableList: variables }, false, "setVariableList"),
      setSelectedVariable: (variable) => set({ selectedVariable: variable }, false, "setSelectedVariable"),
      setFetchedData: (data) => set({ fetchedData: data }, false, "setFetchedData"),
      setIsLoading: (loading) => set({ isLoading: loading }, false, "setIsLoading"),
      setIsFetching: (fetching) => set({ isFetching: fetching }, false, "setIsFetching"),

      setPulse: (pulse) => set({ pulse }, false, "setPulse"),
      setTotalVariablePages: (pages) => set({ totalVariablePages: pages }, false, "setTotalVariablePages"),
      setLoadedVariablePages: (pages) => set({ loadedVariablePages: pages }, false, "setLoadedVariablePages"),
      setIsVariableLoadingComplete: (complete) => set({ isVariableLoadingComplete: complete }, false, "setIsVariableLoadingComplete"),
      setVariableSearchCache: (cache) => set({ variableSearchCache: cache }, false, "setVariableSearchCache"),
      updateVariableSearchCache: (key, value) => {
        set((state) => {
          const newCache = new Map(state.variableSearchCache);
          // Evict oldest entries if cache exceeds 50 entries
          if (newCache.size >= 50) {
            const firstKey = newCache.keys().next().value;
            if (firstKey) newCache.delete(firstKey);
          }
          newCache.set(key, value);
          return { variableSearchCache: newCache };
        }, false, "updateVariableSearchCache");
      },

      // Reset actions
      resetVariableData: () => set({
        variableList: [],
        selectedVariable: null,
        totalVariablePages: 0,
        loadedVariablePages: 0,
        isVariableLoadingComplete: false,
        variableSearchCache: new Map(),
      }, false, "resetVariableData"),

      resetAllData: () => set({
        selectedDomain: null,
        selectedVariable: null,
        variableList: [],
        fetchedData: null,
        totalVariablePages: 0,
        loadedVariablePages: 0,
        isVariableLoadingComplete: false,
        variableSearchCache: new Map(),
      }, false, "resetAllData"),

      // API actions
      fetchAllDomains: async () => {
        const { bpsKey } = get();
        set({ isLoading: true }, false, "fetchAllDomains");

        if (!bpsKey) {
          console.error("BPS API Key not found");
          set({ isLoading: false }, false, "fetchAllDomains");
          return;
        }

        try {
          const response = await fetch(
            `https://webapi.bps.go.id/v1/api/domain/type/all/key/${bpsKey}`
          );
          const res = await response.json();
          let filteredRes = res.data[1].filter(
            (item: DomainItem) => item.domain_id !== "0000"
          );
          filteredRes = [
            { domain_id: "0000", domain_name: "Nasional" },
            ...filteredRes,
          ];
          const filteredResTransformed = filteredRes.map(({ domain_id, domain_name }: DomainItem) => ({
            value: domain_id,
            label: domain_name,
          }));
          set({ domainList: filteredResTransformed, isLoading: false }, false, "fetchAllDomains");
        } catch (error) {
          console.warn(error);
          set({ isLoading: false }, false, "fetchAllDomains");
        }
      },

      fetchInitialVariables: async () => {
        const {
          selectedDomain,
          bpsKey,
          setVariableList,
          setTotalVariablePages,
          setLoadedVariablePages,
          setIsVariableLoadingComplete,
        } = get();

        if (!selectedDomain || !bpsKey) {
          return [];
        }

        const currentDomain = selectedDomain;
        const isStaleDomain = () => get().selectedDomain !== currentDomain;

        try {
          const pageCountResponse = await fetch(
            `https://webapi.bps.go.id/v1/api/list/model/var/domain/${currentDomain}/key/${bpsKey}`
          );
          const pageCountRes = await pageCountResponse.json();
          const totalPages = pageCountRes.data?.[0]?.pages || 0;

          setTotalVariablePages(totalPages);
          setLoadedVariablePages(0);
          setIsVariableLoadingComplete(totalPages === 0);

          if (totalPages === 0 || isStaleDomain()) {
            setVariableList([]);
            return [];
          }

          const initialPageCount = Math.min(INITIAL_VARIABLE_PAGE_LOAD, totalPages);
          const initialVariables = await fetchVariablePagesRange(
            currentDomain,
            1,
            initialPageCount,
            bpsKey
          );

          if (isStaleDomain()) {
            return [];
          }

          setVariableList(initialVariables);
          setLoadedVariablePages(initialPageCount);

          if (initialPageCount === totalPages) {
            setIsVariableLoadingComplete(true);
            return initialVariables;
          }

          const appendVariables = (newOptions: SelectOption[]) => {
            if (!newOptions.length) return;

            set((state) => {
              const existingIds = new Set(state.variableList.map((opt) => opt.value));
              const merged = [...state.variableList];

              newOptions.forEach((opt) => {
                if (!existingIds.has(opt.value)) {
                  merged.push(opt);
                  existingIds.add(opt.value);
                }
              });

              return { variableList: merged };
            }, false, "appendVariableList");
          };

          const loadRemainingPages = async () => {
            let nextStart = initialPageCount + 1;

            while (nextStart <= totalPages) {
              const nextEnd = Math.min(
                nextStart + BACKGROUND_VARIABLE_CHUNK_SIZE - 1,
                totalPages
              );

              const batch = await fetchVariablePagesRange(
                currentDomain,
                nextStart,
                nextEnd,
                bpsKey
              );

              if (isStaleDomain()) {
                return;
              }

              appendVariables(batch);
              setLoadedVariablePages(nextEnd);
              nextStart = nextEnd + 1;
            }

            if (!isStaleDomain()) {
              setIsVariableLoadingComplete(true);
            }
          };

          loadRemainingPages().catch((error) => {
            console.error("[fetchInitialVariables] Background loading error:", error);
            if (!isStaleDomain()) {
              setIsVariableLoadingComplete(true);
            }
          });

          return initialVariables;
        } catch (error) {
          console.error("[fetchInitialVariables] Error occurred:", error);
          setIsVariableLoadingComplete(true);
          return [];
        }
      },

      fetchVariableData: async () => {
        const { selectedVariable, selectedDomain, bpsKey, setIsFetching, setFetchedData } = get();

        setIsFetching(true);
        if (!selectedVariable || !selectedDomain || !bpsKey) {
          setIsFetching(false);
          return;
        }

        try {
          const pageThCountResponse = await fetch(
            `https://webapi.bps.go.id/v1/api/list/model/th/domain/${selectedDomain}/var/${selectedVariable}/key/${bpsKey}`
          );
          const pageThCountRes = await pageThCountResponse.json();
          const pageThCount = pageThCountRes.data[0].pages;

          const pagePromises = Array.from({ length: pageThCount }, (_, page) =>
            fetch(
              `https://webapi.bps.go.id/v1/api/list/model/th/domain/${selectedDomain}/var/${selectedVariable}/page/${page + 1}/key/${bpsKey}`
            ).then(res => res.json())
          );
          const responses = await Promise.all(pagePromises);
          const tahunList = responses.flatMap(res => res.data[1] || []);

          let combinedData: FetchedData = {
            var: null,
            turvar: [],
            vervar: [],
            tahun: [],
            turtahun: [],
            datacontent: {},
          };
          let allTahunObjects: TahunItem[] = [];
          let uniqueTurtahun = new Set<string>();

          const fetchPromises = tahunList.map(async (yearInfo) => {
            const result = await fetch(
              `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/${selectedDomain}/var/${selectedVariable}/th/${yearInfo.th_id}/key/${bpsKey}`
            ).then((response) => response.json());
            if (result.status === "OK" && result.datacontent) {
              return result;
            }
            console.warn(`No data or API error for year ${yearInfo.th_name}`);
            return null;
          });

          const responsesForYears = await Promise.all(fetchPromises);

          responsesForYears.forEach((dataForYear) => {
            if (dataForYear) {
              if (!combinedData.var) combinedData.var = dataForYear.var;
              if (!combinedData.turvar.length)
                combinedData.turvar = dataForYear.turvar;
              if (!combinedData.vervar.length)
                combinedData.vervar = dataForYear.vervar;
              if (!combinedData.turtahun.length)
                combinedData.turtahun = dataForYear.turtahun;

              combinedData.datacontent = {
                ...combinedData.datacontent,
                ...dataForYear.datacontent,
              };

              if (dataForYear.tahun) {
                allTahunObjects = allTahunObjects.concat(dataForYear.tahun);
              }

              if (dataForYear.turtahun) {
                dataForYear.turtahun.forEach((tt: TurtahunItem) =>
                  uniqueTurtahun.add(JSON.stringify(tt))
                );
              }
            }
          });

          combinedData.tahun = allTahunObjects.sort(
            (a, b) => parseInt(a.val) - parseInt(b.val)
          );
          combinedData.turtahun = Array.from(uniqueTurtahun).map((tt) =>
            JSON.parse(tt)
          );
          setFetchedData(combinedData);
        } catch (error) {
          console.warn(error);
        } finally {
          setIsFetching(false);
        }
      },

      searchDomains: async (query: string, signal?: AbortSignal): Promise<SelectOption[]> => {
        const { domainList } = get();

        if (!query.trim()) {
          return domainList;
        }

        const queryLower = query.toLowerCase();
        return domainList.filter(opt =>
          opt.label.toLowerCase().includes(queryLower)
        );
      },

      searchVariables: async (query: string, signal?: AbortSignal): Promise<SelectOption[]> => {
        const { selectedDomain, variableList, variableSearchCache } = get();
        const cacheKey = `${selectedDomain}-${query}`;

        // Check cache first
        if (variableSearchCache.has(cacheKey)) {
          return variableSearchCache.get(cacheKey)!;
        }

        // For now, use a more efficient approach - fetch more pages but search client-side
        // In the future, you could use BPS's search API if available
        let results: SelectOption[] = [];

        if (!variableList.length) {
          // If no variables loaded yet, load the first 3 pages
          results = await loadVariablesPaginated(selectedDomain!, 3, query, signal);
        } else {
          // Use loaded variables and filter client-side
          const queryLower = query.toLowerCase();
          results = variableList.filter(opt =>
            opt.label.toLowerCase().includes(queryLower)
          );
        }

        // Cache the results
        set((state) => {
          const newCache = new Map(state.variableSearchCache);
          newCache.set(cacheKey, results);
          return { variableSearchCache: newCache };
        }, false, "searchVariables");

        return results;
      },

      exportToExcel: () => {
        const { fetchedData, selectedVariable } = get();
        if (!fetchedData) return;

        // Dynamic import for XLSX to avoid SSR issues
        import("xlsx").then((XLSX) => {
          const excelData: any[] = [];

          // Add header rows
          const header1 = [
            "Komponen",
            "Turunan",
            ...fetchedData.tahun.flatMap(th =>
              Array(fetchedData.turtahun.length).fill(th.label)
            )
          ];
          excelData.push(header1);

          const header2 = [
            "",
            "",
            ...Array(fetchedData.tahun.length).fill(fetchedData.turtahun).flat().map(turth => turth.label)
          ];
          excelData.push(header2);

          // Add data rows
          fetchedData.vervar.forEach((vervar) => {
            fetchedData.turvar.forEach((turvar) => {
              const row: any[] = [vervar.label, turvar.val === 0 ? "" : turvar.label];
              fetchedData.tahun.forEach((tahun) => {
                fetchedData.turtahun.forEach((turtahun) => {
                  const key = `${vervar.val}${selectedVariable}${turvar.val}${tahun.val}${turtahun.val}`;
                  row.push(fetchedData.datacontent[key] || "");
                });
              });
              excelData.push(row);
            });
          });

          // Create workbook and worksheet
          const ws = XLSX.utils.aoa_to_sheet(excelData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Data BPS");

          // Generate filename with current date
          const date = new Date().toISOString().split("T")[0];
          const filename = `BPS_Data_${date}.xlsx`;

          // Save file
          XLSX.writeFile(wb, filename);
        });
      },
    }),
    { name: "BPSData" }
  )
);

// Selectors for better performance
export const useBPSDomainList = () => useBPSDataStore((state) => state.domainList);
export const useBPSSelectedDomain = () => useBPSDataStore((state) => state.selectedDomain);
export const useBPSVariableList = () => useBPSDataStore((state) => state.variableList);
export const useBPSSelectedVariable = () => useBPSDataStore((state) => state.selectedVariable);
export const useBPSFetchedData = () => useBPSDataStore((state) => state.fetchedData);
export const useBPSIsLoading = () => useBPSDataStore((state) => state.isLoading);
export const useBPSIsFetching = () => useBPSDataStore((state) => state.isFetching);
export const useBPSPulse = () => useBPSDataStore((state) => state.pulse);
export const useBPSVariableLoadingProgress = () => {
  const totalPages = useBPSDataStore((state) => state.totalVariablePages);
  const loadedPages = useBPSDataStore((state) => state.loadedVariablePages);
  const isComplete = useBPSDataStore((state) => state.isVariableLoadingComplete);

  return { totalPages, loadedPages, isComplete };
};

// Actions selectors with stable references
export const useBPSActions = () => {
  const store = useBPSDataStore();

  // Use refs to maintain stable references
  const actionsRef = useRef({
    setDomainList: store.setDomainList,
    setSelectedDomain: store.setSelectedDomain,
    setSelectedVariable: store.setSelectedVariable,
    resetVariableData: store.resetVariableData,
    resetAllData: store.resetAllData,
    fetchAllDomains: store.fetchAllDomains,
    fetchInitialVariables: store.fetchInitialVariables,
    fetchVariableData: store.fetchVariableData,
    searchDomains: store.searchDomains,
    searchVariables: store.searchVariables,
    exportToExcel: store.exportToExcel,
  });

  return actionsRef.current;
};

// Individual action selectors for better granularity
export const useBPSSetSelectedDomain = () => useBPSDataStore((state) => state.setSelectedDomain);
export const useBPSSetSelectedVariable = () => useBPSDataStore((state) => state.setSelectedVariable);
export const useBPSFetchAllDomains = () => useBPSDataStore((state) => state.fetchAllDomains);
export const useBPSFetchInitialVariables = () => useBPSDataStore((state) => state.fetchInitialVariables);
export const useBPSFetchVariableData = () => useBPSDataStore((state) => state.fetchVariableData);
export const useBPSSearchDomains = () => useBPSDataStore((state) => state.searchDomains);
export const useBPSSearchVariables = () => useBPSDataStore((state) => state.searchVariables);
export const useBPSExportToExcel = () => useBPSDataStore((state) => state.exportToExcel);
export const useBPSResetVariableData = () => useBPSDataStore((state) => state.resetVariableData);
export const useBPSSetPulse = () => useBPSDataStore((state) => state.setPulse);
