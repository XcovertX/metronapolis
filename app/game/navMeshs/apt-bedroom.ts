import type { WalkCollisionData } from "./types";

export const aptBedroomNavmesh: WalkCollisionData = {
  "version": 1,
  "walkables": [
    {
      "id": "walk_b683050a92b0f8_19b2d7e34e9",
      "name": "Walkable 1",
      "points": [
        {
          "x": 80,
          "y": 616
        },
        {
          "x": 168,
          "y": 520
        },
        {
          "x": 448,
          "y": 520
        },
        {
          "x": 504,
          "y": 616
        }
      ]
    }
  ],
  "colliders": [],
  "collisionPoints": [],
  "sceneChangeZones": [
    {
      "id": "scene_a332c1d082b7b8_19b38011f83",
      "name": "apt-bedroom to apt-living",
      "points": [
        {
          "x": 88,
          "y": 592
        },
        {
          "x": 512,
          "y": 592
        },
        {
          "x": 512,
          "y": 624
        },
        {
          "x": 88,
          "y": 624
        }
      ],
      "targetSceneId": "apt-living"
    }
  ]
};



