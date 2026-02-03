{
  "title": "Simply supported beam",
  "spans": [
    {
      "length": 4,
      "ei":2,
      "axis":"x",
      "horizontal_distance_from_left_end_origin":0,
      "vertical_distance_from_left_end_origin":0,
    },
    {
      "length": 4,
      "ei":1,
      "axis":"-y",
      "horizontal_distance_from_left_end_origin":4,
      "vertical_distance_from_left_end_origin":0,
    },
    {
      "length": 2,
      "ei":2,
      "axis":"x",
      "horizontal_distance_from_left_end_origin":4,
      "vertical_distance_from_left_end_origin":0,
    },
  ],
    "supports": [
    {
      "name": "hinge",
      "horizontal_distance_from_left_end_origin":0,
      "vertical_distance_from_left_end_origin":0,

    },
    {
      "name": "hinge",
      "horizontal_distance_from_left_end_origin":4,
      "vertical_distance_from_left_end_origin":-4,
    },
  ],
  "loads": [
    {
      "name": "udl",
      "load_per_distance": 10,
      "load_span": 4,
      "axis": "x",
      "horizontal_distance_from_left_end_origin":0,
      "vertical_distance_from_left_end_origin":0,
    },
    {
      "name": "point_load",
      "point_load_magnitude": 20,
      "axis": "-x",
      "horizontal_distance_from_left_end_origin":4,
      "vertical_distance_from_left_end_origin":-2,
    },
    {
      "name": "point_load",
      "point_load_magnitude": 10,
      "axis": "-y",
      "horizontal_distance_from_left_end_origin":6,
      "vertical_distance_from_left_end_origin":0,
    },
    {
      "name": "vdl",
      "load_span": 4,
      "left_load_per_distance": 10,
      "right_load_per_distance": 15,
      "axis": "x",
      "horizontal_distance_from_left_end_origin":0,
      "vertical_distance_from_left_end_origin":0,
    },
  ]
}

