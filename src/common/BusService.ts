import { Bus } from '../models/Bus';

export const getBusByRoute = async (from: string, to: string) => {
  const start = new RegExp(from, 'i');
  const end = new RegExp(to, 'i');

  const buses = await Bus.aggregate([
    {
      $match: {
        'routeInfo.placeName': {
          $all: [start, end],
        },
      },
    },
    {
      // Step 2: Retrieve all the place names that matched `fromPattern` and `toPattern`
      $addFields: {
        fromIndex: {
          $indexOfArray: [
            '$routeInfo.placeName',
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$routeInfo.placeName',
                    cond: {
                      $regexMatch: {
                        input: '$$this',
                        regex: new RegExp(from, 'i'),
                      },
                    },
                  },
                },
                0,
              ],
            },
          ],
        },
        toIndex: {
          $indexOfArray: [
            '$routeInfo.placeName',
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$routeInfo.placeName',
                    cond: {
                      $regexMatch: {
                        input: '$$this',
                        regex: new RegExp(to, 'i'),
                      },
                    },
                  },
                },
                0,
              ],
            },
          ],
        },
      },
    },
    {
      // Step 3: Ensure fromIndex is less than toIndex for directionality
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
