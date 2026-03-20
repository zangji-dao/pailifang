import { relations } from "drizzle-orm/relations";
import { auxiliaryTypes, auxiliaryItems, accountAuxiliarySettings, auxiliaryBalances, bases, meters, spaces, regNumbers, enterprises } from "./schema";

export const auxiliaryItemsRelations = relations(auxiliaryItems, ({one, many}) => ({
	auxiliaryType: one(auxiliaryTypes, {
		fields: [auxiliaryItems.typeId],
		references: [auxiliaryTypes.id]
	}),
	auxiliaryBalances: many(auxiliaryBalances),
}));

export const auxiliaryTypesRelations = relations(auxiliaryTypes, ({many}) => ({
	auxiliaryItems: many(auxiliaryItems),
	accountAuxiliarySettings: many(accountAuxiliarySettings),
	auxiliaryBalances: many(auxiliaryBalances),
}));

export const accountAuxiliarySettingsRelations = relations(accountAuxiliarySettings, ({one}) => ({
	auxiliaryType: one(auxiliaryTypes, {
		fields: [accountAuxiliarySettings.auxiliaryTypeId],
		references: [auxiliaryTypes.id]
	}),
}));

export const auxiliaryBalancesRelations = relations(auxiliaryBalances, ({one}) => ({
	auxiliaryItem: one(auxiliaryItems, {
		fields: [auxiliaryBalances.auxiliaryItemId],
		references: [auxiliaryItems.id]
	}),
	auxiliaryType: one(auxiliaryTypes, {
		fields: [auxiliaryBalances.auxiliaryTypeId],
		references: [auxiliaryTypes.id]
	}),
}));

export const metersRelations = relations(meters, ({one, many}) => ({
	base: one(bases, {
		fields: [meters.baseId],
		references: [bases.id]
	}),
	spaces: many(spaces),
}));

export const basesRelations = relations(bases, ({many}) => ({
	meters: many(meters),
}));

export const spacesRelations = relations(spaces, ({one, many}) => ({
	meter: one(meters, {
		fields: [spaces.meterId],
		references: [meters.id]
	}),
	regNumbers: many(regNumbers),
}));

export const regNumbersRelations = relations(regNumbers, ({one}) => ({
	space: one(spaces, {
		fields: [regNumbers.spaceId],
		references: [spaces.id]
	}),
	enterprise: one(enterprises, {
		fields: [regNumbers.enterpriseId],
		references: [enterprises.id]
	}),
}));

export const enterprisesRelations = relations(enterprises, ({many}) => ({
	regNumbers: many(regNumbers),
}));