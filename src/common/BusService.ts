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
    {
      $addFields: {
        startDepartureTime: {
          $arrayElemAt: ['$routeInfo.departureTime', '$fromIndex'],
        },
      },
    },
    {
      $sort: {
        startDepartureTime: 1, // 1 for ascending order
      },
    },
  ]);

  return buses;
};
