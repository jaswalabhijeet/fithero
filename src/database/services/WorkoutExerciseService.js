/* @flow */

import realm from '../index';
import type { WorkoutExerciseSchemaType } from '../types';
import type { DispatchType } from '../../types';
import { extractWorkoutKeyFromDatabase } from '../utils';
import { dateToString, toDate } from '../../utils/date';
import { getExercise, updateExercise } from '../../redux/modules/workouts';

export const addExercise = (
  dispatch: (fn: DispatchType<WorkoutExerciseSchemaType>) => void,
  exercise: WorkoutExerciseSchemaType
) => {
  // Optimistic update to Redux
  dispatch(getExercise(exercise));

  realm.write(() => {
    const workoutId = extractWorkoutKeyFromDatabase(exercise.id);
    let workout = realm.objectForPrimaryKey('Workout', workoutId);
    if (!workout) {
      workout = realm.create('Workout', {
        id: workoutId,
        date: toDate(workoutId),
      });
    }
    workout.exercises.push(exercise);
  });
};

export const deleteExercise = (exercise: WorkoutExerciseSchemaType) => {
  const workoutId = extractWorkoutKeyFromDatabase(exercise.id);
  realm.delete(exercise);
  // Now we check if workout needs to be deleted too
  const workout = realm.objectForPrimaryKey('Workout', workoutId);
  if (workout.exercises.length > 0) {
    // If workout was not deleted, but one exercise yes, let's fix the sort
    workout.exercises.forEach((e, i) => {
      e.sort = i + 1;
    });
  } else {
    realm.delete(workout);
  }
};

export const updateExercisePaperForWorkout = (
  dispatch: (fn: DispatchType<WorkoutExerciseSchemaType>) => void,
  exercise: WorkoutExerciseSchemaType
) => {
  realm.write(() => {
    dispatch(updateExercise(exercise));

    const workoutId = dateToString(exercise.date);
    const workout = realm.objectForPrimaryKey('Workout', workoutId);
    const existingExercise = workout.exercises.filtered(
      `id = "${exercise.id}"`
    )[0];
    const existingSets = existingExercise.sets;

    // Check for sets that have been deleted first
    const setsToDelete = [];
    existingSets.forEach(existingSet => {
      const set = exercise.sets.find(s => s.id === existingSet.id);
      if (!set) {
        setsToDelete.push(existingSet);
      }
    });

    if (setsToDelete.length > 0) {
      realm.delete(setsToDelete);
    }

    if (exercise.sets.length > 0) {
      existingExercise.comments = exercise.comments || null;
      exercise.sets.forEach(s => {
        const set = existingSets.filtered(`id = "${s.id}"`)[0];
        if (set) {
          // Update set
          set.reps = s.reps;
          set.weight = s.weight;
        } else {
          // Add new set
          existingSets.push(s);
        }
      });
    } else {
      // Delete exercise
      deleteExercise(existingExercise);
    }
  });
};