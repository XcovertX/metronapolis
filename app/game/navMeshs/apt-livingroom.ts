import type { WalkCollisionData } from "./types";

export const aptLivingroomNavmesh: WalkCollisionData = {
  "version": 1,
  "walkables": [
    {
      "id": "walk_e6673931901d5_19b2d7f9dd1",
      "name": "Walkable 1",
      "points": [
        {
          "x": 8,
          "y": 840
        },
        {
          "x": 0,
          "y": 1416
        },
        {
          "x": 712,
          "y": 1448
        },
        {
          "x": 728,
          "y": 640
        }
      ]
    }
  ],
  "colliders": [],
  "collisionPoints": [],
  "sceneChangeZones": [
    {
      "id": "scene_3007d8d3ecc4c8_19b37cfc300",
      "name": "apt-living to apt-bedroom",
      "points": [
        {
          "x": 8,
          "y": 872
        },
        {
          "x": 8,
          "y": 992
        },
        {
          "x": 88,
          "y": 1000
        },
        {
          "x": 80,
          "y": 864
        }
      ],
      "targetSceneId": "apt-bedroom"
    }
  ]
};


