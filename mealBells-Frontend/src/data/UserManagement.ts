import a1 from "../assets/a1.png";
import a2 from "../assets/a2.png";
import a3 from "../assets/a3.png";
import a4 from "../assets/a4.png";
import a5 from "../assets/a5.png";
import type { EditForm } from "../types/admin";

export const AVATARS = [a1, a2, a3, a4, a5];
export const PAGE_SIZE = 5;
export const DEPARTMENTS = ["ENGINEERING","MARKETING","PRODUCT","SALES","HUMAN RESOURCES","FINANCE","DESIGN"];
export const GENDER_OPTIONS = ["Male","Female","Other"];

export const fields: { key: keyof EditForm; label: string; placeholder: string; type?: string }[] = [
    { key: "name",  label: "Full Name", placeholder: "e.g. Jane Smith" },
    { key: "email", label: "Email",     placeholder: "e.g. jane@company.com", type: "email" },
    { key: "phone", label: "Phone",     placeholder: "e.g. +1 (555) 000-0000" },
  ];



  