"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Group, Expense, ReceivingMethod } from "./types";

interface WarikanStore {
  groups: Group[];
  addGroup: (name: string) => Group;
  getGroup: (id: string) => Group | undefined;
  deleteGroup: (groupId: string) => void;
  addMember: (groupId: string, name: string) => void;
  removeMember: (groupId: string, memberId: string) => void;
  addExpense: (groupId: string, expense: Omit<Expense, "id">) => void;
  updateExpense: (groupId: string, expenseId: string, expense: Omit<Expense, "id">) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
  importGroup: (group: Group) => void;
  toggleSettlementCompleted: (groupId: string, key: string) => void;
  resetGroupExpenses: (groupId: string) => void;
  updateMemberPreference: (groupId: string, memberId: string, method: ReceivingMethod) => void;
  updateGroupName: (groupId: string, name: string) => void;
}

export const useStore = create<WarikanStore>()(
  persist(
    (set, get) => ({
      groups: [],

      addGroup: (name: string) => {
        const group: Group = {
          id: nanoid(8),
          name,
          currency: "JPY",
          members: [],
          expenses: [],
          completedSettlements: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ groups: [...state.groups, group] }));
        return group;
      },

      getGroup: (id: string) => {
        return get().groups.find((g) => g.id === id);
      },

      deleteGroup: (groupId: string) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
      },

      addMember: (groupId: string, name: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: [...g.members, { id: nanoid(6), name }],
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      removeMember: (groupId: string, memberId: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.filter((m) => m.id !== memberId),
                  expenses: g.expenses.filter(
                    (e) =>
                      e.paidBy !== memberId &&
                      !e.splitAmong.every((id) => id === memberId)
                  ),
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      addExpense: (groupId: string, expense: Omit<Expense, "id">) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: [...g.expenses, { ...expense, id: nanoid(8) }],
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      updateExpense: (groupId: string, expenseId: string, expense: Omit<Expense, "id">) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.map((e) =>
                    e.id === expenseId ? { ...expense, id: expenseId } : e
                  ),
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      removeExpense: (groupId: string, expenseId: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.filter((e) => e.id !== expenseId),
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      toggleSettlementCompleted: (groupId: string, key: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  completedSettlements: (g.completedSettlements || []).includes(key)
                    ? (g.completedSettlements || []).filter((k) => k !== key)
                    : [...(g.completedSettlements || []), key],
                }
              : g
          ),
        }));
      },

      resetGroupExpenses: (groupId: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: [],
                  completedSettlements: [],
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      updateMemberPreference: (groupId: string, memberId: string, method: ReceivingMethod) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.map((m) =>
                    m.id === memberId
                      ? { ...m, preferredReceivingMethod: method }
                      : m
                  ),
                  updatedAt: Date.now(),
                }
              : g
          ),
        }));
      },

      updateGroupName: (groupId: string, name: string) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, name, updatedAt: Date.now() }
              : g
          ),
        }));
      },

      importGroup: (group: Group) => {
        set((state) => {
          const exists = state.groups.find((g) => g.id === group.id);
          if (exists) {
            return {
              groups: state.groups.map((g) =>
                g.id === group.id ? { ...group, updatedAt: Date.now() } : g
              ),
            };
          }
          return { groups: [...state.groups, group] };
        });
      },
    }),
    { name: "warikan-storage" }
  )
);
