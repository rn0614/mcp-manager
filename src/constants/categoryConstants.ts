// categoryConstants.ts - 카테고리 관련 상수 정의
import { Code, Database, Globe, Layers, Settings } from "lucide-react";
import type { CreateMCPCategory } from "../type";

// 기본 카테고리 설정
export const DEFAULT_CATEGORY: CreateMCPCategory = {
  name: "",
  description: "",
  icon: "Layers",
  target: "all",
  isActive: false,
};

// 아이콘 맵핑
export const ICON_MAP = {
  Code: Code,
  Database: Database,
  Globe: Globe,
  Layers: Layers,
  Settings: Settings,
} as const;

// 아이콘 옵션
export const ICON_OPTIONS = [
  { value: "Code", label: "Code" },
  { value: "Database", label: "Database" },
  { value: "Globe", label: "Globe" },
  { value: "Layers", label: "Layers" },
  { value: "Settings", label: "Settings" },
] as const;
