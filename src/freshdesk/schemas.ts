import { z } from 'zod';
import { TICKET_PRIORITY, TICKET_STATUS } from './types.js';

const statusValues = Object.values(TICKET_STATUS) as [number, ...number[]];
const priorityValues = Object.values(TICKET_PRIORITY) as [number, ...number[]];

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(30),
});

export const listTicketsInputSchema = paginationSchema.extend({
  status: z
    .number()
    .int()
    .refine((v) => statusValues.includes(v), 'Unsupported status filter')
    .optional(),
  priority: z
    .number()
    .int()
    .refine((v) => priorityValues.includes(v), 'Unsupported priority filter')
    .optional(),
});

export const getTicketInputSchema = z.object({
  ticket_id: z.number().int().positive(),
});

export const searchTicketsInputSchema = paginationSchema.extend({
  query: z.string().trim().min(1).max(200),
  status: z
    .number()
    .int()
    .refine((v) => statusValues.includes(v), 'Unsupported status filter')
    .optional(),
  priority: z
    .number()
    .int()
    .refine((v) => priorityValues.includes(v), 'Unsupported priority filter')
    .optional(),
});

export type ListTicketsInput = z.infer<typeof listTicketsInputSchema>;
export type GetTicketInput = z.infer<typeof getTicketInputSchema>;
export type SearchTicketsInput = z.infer<typeof searchTicketsInputSchema>;
