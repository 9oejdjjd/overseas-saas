import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT", "FOLLOW_UP_STAFF"]).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT", "FOLLOW_UP_STAFF"]).optional(),
  active: z.boolean().optional(),
});

export const sessionStartSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(), 
  name: z.string().optional(),
});

export const applicantCreateSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  profession: z.string().min(2, "Profession is required"),
  phone: z.string().min(5, "Phone is required"),
  whatsappNumber: z.string().min(5, "WhatsApp is required"),
  platformEmail: z.string().email().optional().or(z.literal("")),
  platformPassword: z.string().optional().or(z.literal("")),
});
