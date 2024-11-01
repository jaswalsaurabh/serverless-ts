import { Bus } from '../models/Bus';

export const getBusByRoute = async (start: string, end: string) => {
  const buses = await Bus.aggregate([
    {
      $match: {
        'routeInfo.placeName': { $all: [start, end] },
      },
    },
    {
      $addFields: {
        fromIndex: { $indexOfArray: ['$routeInfo.placeName', start] },
        toIndex: { $indexOfArray: ['$routeInfo.placeName', end] },
      },
    },
    {
      $match: {
        $expr: { $lt: ['$fromIndex', '$toIndex'] },
      },
    },
  ]);

  return buses;
};
