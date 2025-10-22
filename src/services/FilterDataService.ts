import { Option } from '@/types/filters';

export class FilterDataService {
  private cache = new Map<string, Option[]>();
  private dataLoaders = new Map<string, () => Promise<Option[]>>();

  constructor() {
    this.initializeDataLoaders();
  }

  private initializeDataLoaders() {
    // Register data loaders for each filter type
    this.dataLoaders.set('kddept', () => this.loadKddept());
    this.dataLoaders.set('kdunit', () => this.loadKdunit());
    this.dataLoaders.set('kdkanwil', () => this.loadKdkanwil());
    this.dataLoaders.set('kdkppn', () => this.loadKdkppn());
    this.dataLoaders.set('kdlokasi', () => this.loadKdlokasi());
    this.dataLoaders.set('kddekon', () => this.loadKddekon());
    this.dataLoaders.set('kdkabkota', () => this.loadKdkabkota());
    this.dataLoaders.set('kdsatker', () => this.loadKdsatker());
    this.dataLoaders.set('kdfungsi', () => this.loadKdfungsi());
    this.dataLoaders.set('kdsfung', () => this.loadKdsfung());
    this.dataLoaders.set('kdprogram', () => this.loadKdprogram());
    this.dataLoaders.set('kdgiat', () => this.loadKdgiat());
    this.dataLoaders.set('kdoutput', () => this.loadKdoutput());
    this.dataLoaders.set('kdsoutput', () => this.loadKdsoutput());
    this.dataLoaders.set('kdakun', () => this.loadKdakun());
    this.dataLoaders.set('kdbkpk', () => this.loadKdbkpk());
    this.dataLoaders.set('kdgbkpk', () => this.loadKdgbkpk());
    this.dataLoaders.set('kdsdana', () => this.loadKdsdana());
  }

  async getFilterOptions(type: string, dependencies?: Record<string, string>): Promise<Option[]> {
    const cacheKey = `${type}-${JSON.stringify(dependencies || {})}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const loader = this.dataLoaders.get(type);
    if (!loader) {
      throw new Error(`No data loader found for filter type: ${type}`);
    }

    const rawData = await loader();
    const options = this.transformDataToOptions(rawData, type, dependencies);
    
    this.cache.set(cacheKey, options);
    return options;
  }

  private async loadKddept(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kddept.json');
    return data.default;
  }

  private async loadKdunit(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdunit.json');
    return data.default;
  }

  private async loadKdkanwil(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdkanwil.json');
    return data.default;
  }

  private async loadKdkppn(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdkppn.json');
    return data.default;
  }

  private async loadKdlokasi(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdlokasi.json');
    return data.default;
  }

  private async loadKddekon(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kddekon.json');
    return data.default;
  }

  private async loadKdkabkota(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdkabkota.json');
    return data.default;
  }

  private async loadKdsatker(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdsatker.json');
    return data.default;
  }

  private async loadKdfungsi(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdfungsi.json');
    return data.default;
  }

  private async loadKdsfung(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdsfung.json');
    return data.default;
  }

  private async loadKdprogram(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdprogram.json');
    return data.default;
  }

  private async loadKdgiat(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdgiat.json');
    return data.default;
  }

  private async loadKdoutput(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdoutput.json');
    return data.default;
  }

  private async loadKdsoutput(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdsoutput.json');
    return data.default;
  }

  private async loadKdakun(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdakun.json');
    return data.default;
  }

  private async loadKdbkpk(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdbkpk.json');
    return data.default;
  }

  private async loadKdgbkpk(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdgbkpk.json');
    return data.default;
  }

  private async loadKdsdana(): Promise<any[]> {
    const data = await import('@/components/inquiry-data/filters/data/kdsdana.json');
    return data.default;
  }

  private transformDataToOptions(data: any[], type: string, dependencies?: Record<string, string>): Option[] {
    switch (type) {
      case 'kddept':
        return data.map(item => ({
          value: item.kddept,
          label: item.nmdept,
        }));
      case 'kdunit':
        if (dependencies?.kddept) {
          return data
            .filter(item => item.kddept === dependencies.kddept)
            .map(item => ({
              value: item.kdunit,
              label: item.nmunit,
            }));
        }
        return data.map(item => ({
          value: item.kdunit,
          label: item.nmunit,
        }));
      case 'kdkanwil':
        if (dependencies?.kdlokasi) {
          return data
            .filter(item => item.kdlokasi === dependencies.kdlokasi)
            .map(item => ({
              value: item.kdkanwil,
              label: item.nmkanwil,
            }));
        }
        return data.map(item => ({
          value: item.kdkanwil,
          label: item.nmkanwil,
        }));
      case 'kdkppn':
        if (dependencies?.kdkanwil) {
          return data
            .filter(item => item.kdkanwil === dependencies.kdkanwil)
            .map(item => ({
              value: item.kdkppn,
              label: item.nmkppn,
            }));
        }
        return data.map(item => ({
          value: item.kdkppn,
          label: item.nmkppn,
        }));
      case 'kdlokasi':
        return data.map(item => ({
          value: item.kdlokasi,
          label: item.nmlokasi,
        }));
      case 'kddekon':
        return data.map(item => ({
          value: item.kddekon,
          label: item.nmdekon,
        }));
      case 'kdkabkota':
        if (dependencies?.kdlokasi) {
          return data
            .filter(item => item.kdlokasi === dependencies.kdlokasi)
            .map(item => ({
              value: item.kdkabkota,
              label: item.nmkabkota,
            }));
        }
        return data.map(item => ({
          value: item.kdkabkota,
          label: item.nmkabkota,
        }));
      case 'kdsatker':
        return data.map(item => ({
          value: item.kdsatker,
          label: item.nmsatker,
        }));
      case 'kdfungsi':
        return data.map(item => ({
          value: item.kdfungsi,
          label: item.nmfungsi,
        }));
      case 'kdsfung':
        if (dependencies?.kdfungsi) {
          return data
            .filter(item => item.kdfungsi === dependencies.kdfungsi)
            .map(item => ({
              value: item.kdsfung,
              label: item.nmsfung,
            }));
        }
        return data.map(item => ({
          value: item.kdsfung,
          label: item.nmsfung,
        }));
      case 'kdprogram':
        return data.map(item => ({
          value: item.kdprogram,
          label: item.nmprogram,
        }));
      case 'kdgiat':
        if (dependencies?.kdprogram) {
          return data
            .filter(item => item.kdprogram === dependencies.kdprogram)
            .map(item => ({
              value: item.kdgiat,
              label: item.nmgiat,
            }));
        }
        return data.map(item => ({
          value: item.kdgiat,
          label: item.nmgiat,
        }));
      case 'kdoutput':
        if (dependencies?.kdgiat) {
          return data
            .filter(item => item.kdgiat === dependencies.kdgiat)
            .map(item => ({
              value: item.kdoutput,
              label: item.nmoutput,
            }));
        }
        return data.map(item => ({
          value: item.kdoutput,
          label: item.nmoutput,
        }));
      case 'kdsoutput':
        if (dependencies?.kdoutput) {
          return data
            .filter(item => item.kdoutput === dependencies.kdoutput)
            .map(item => ({
              value: item.kdsoutput,
              label: item.nmsoutput,
            }));
        }
        return data.map(item => ({
          value: item.kdsoutput,
          label: item.nmsoutput,
        }));
      case 'kdakun':
        return data.map(item => ({
          value: item.kdakun,
          label: item.nmakun,
        }));
      case 'kdbkpk':
        return data.map(item => ({
          value: item.kdbkpk,
          label: item.nmbkpk,
        }));
      case 'kdgbkpk':
        return data.map(item => ({
          value: item.kdgbkpk,
          label: item.nmgbkpk,
        }));
      case 'kdsdana':
        return data.map(item => ({
          value: item.kdsdana,
          label: item.nmsdana,
        }));
      default:
        return [];
    }
  }

  clearCache(type?: string) {
    if (type) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(type));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}