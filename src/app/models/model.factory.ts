import { User, }  from './user.model';
import { Watch }  from './watch.model';
import { Measure, MeasureStatus }  from './measure.model';
import { Injectable } from '@angular/core';

export class ModelFactory{


	/**
	 * Builds an User from json response
	 * @param  {any}  jsonUser
	 * @return {User}         
	 */
	static buildUser(jsonUser: any): User {

		return new User(
			jsonUser.userId,
			jsonUser.email,
			jsonUser.firstname,
			jsonUser.name,
			jsonUser.country,
			jsonUser.registerDate,
			jsonUser.key,
			ModelFactory.buildWatches(jsonUser.watches)
		);
	}

	/**
	 * Builds a watch from json response
	 * @param  {any}     jsonWatches
	 * @return {Watch[]}            
	 */
	static buildWatches(jsonWatches: any): Watch[] {
		return jsonWatches.map(function(jsonWatch) {
			return new Watch(
				jsonWatch.watchId,
				jsonWatch.brand,
				jsonWatch.historySize,
				jsonWatch.measures.map(function(jsonMeasure) {
					return new Measure(
						jsonMeasure.id,
						jsonMeasure.measureUserTime,
						jsonMeasure.measureReferenceTime,
						jsonMeasure.status,
						jsonMeasure.accuracyUserTime,
						jsonMeasure.accuracyReferenceTime,
						jsonMeasure.accuracy,
						jsonMeasure.accuracyAge)
				}),
				jsonWatch.name,
				jsonWatch.yearOfBuy,
				jsonWatch.serial,
				jsonWatch.caliber
			)
		});
	}
}