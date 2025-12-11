"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

type PixiStageProps = {
  background?: number;
};

// Path to your big tilesheet image
const SPRITESHEET_URL = "/assets/tiles.png";

// --- Sprite frame metadata you provided ---
type SpriteFrame = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SPRITE_FRAMES: SpriteFrame[] = [
  {"name":"sprite1270","x":0,"y":0,"width":64,"height":64},
  {"name":"sprite1271","x":64,"y":0,"width":64,"height":64},
  {"name":"sprite1272","x":128,"y":0,"width":64,"height":64},
  {"name":"sprite1273","x":192,"y":0,"width":64,"height":64},
  {"name":"sprite1274","x":256,"y":0,"width":64,"height":64},
  {"name":"sprite1275","x":320,"y":0,"width":64,"height":64},
  {"name":"sprite1276","x":384,"y":0,"width":64,"height":64},
  {"name":"sprite1277","x":448,"y":0,"width":64,"height":64},
  {"name":"sprite1278","x":512,"y":0,"width":64,"height":64},
  {"name":"sprite1279","x":576,"y":0,"width":64,"height":64},
  {"name":"sprite1280","x":640,"y":0,"width":64,"height":64},
  {"name":"sprite1281","x":704,"y":0,"width":64,"height":64},
  {"name":"sprite1282","x":768,"y":0,"width":64,"height":64},
  {"name":"sprite1283","x":832,"y":0,"width":64,"height":64},
  {"name":"sprite1284","x":896,"y":0,"width":64,"height":64},
  {"name":"sprite1285","x":960,"y":0,"width":64,"height":64},
  {"name":"sprite1286","x":0,"y":64,"width":64,"height":64},
  {"name":"sprite1287","x":64,"y":64,"width":64,"height":64},
  {"name":"sprite1288","x":128,"y":64,"width":64,"height":64},
  {"name":"sprite1289","x":192,"y":64,"width":64,"height":64},
  {"name":"sprite1290","x":256,"y":64,"width":64,"height":64},
  {"name":"sprite1291","x":320,"y":64,"width":64,"height":64},
  {"name":"sprite1292","x":384,"y":64,"width":64,"height":64},
  {"name":"sprite1293","x":448,"y":64,"width":64,"height":64},
  {"name":"sprite1294","x":512,"y":64,"width":64,"height":64},
  {"name":"sprite1295","x":576,"y":64,"width":64,"height":64},
  {"name":"sprite1296","x":640,"y":64,"width":64,"height":64},
  {"name":"sprite1297","x":704,"y":64,"width":64,"height":64},
  {"name":"sprite1298","x":768,"y":64,"width":64,"height":64},
  {"name":"sprite1299","x":832,"y":64,"width":64,"height":64},
  {"name":"sprite1300","x":896,"y":64,"width":64,"height":64},
  {"name":"sprite1301","x":960,"y":64,"width":64,"height":64},
  {"name":"sprite1302","x":0,"y":128,"width":64,"height":64},
  {"name":"sprite1303","x":64,"y":128,"width":64,"height":64},
  {"name":"sprite1304","x":128,"y":128,"width":64,"height":64},
  {"name":"sprite1305","x":192,"y":128,"width":64,"height":64},
  {"name":"sprite1306","x":256,"y":128,"width":64,"height":64},
  {"name":"sprite1307","x":320,"y":128,"width":64,"height":64},
  {"name":"sprite1308","x":384,"y":128,"width":64,"height":64},
  {"name":"sprite1309","x":448,"y":128,"width":64,"height":64},
  {"name":"sprite1310","x":512,"y":128,"width":64,"height":64},
  {"name":"sprite1311","x":576,"y":128,"width":64,"height":64},
  {"name":"sprite1312","x":640,"y":128,"width":64,"height":64},
  {"name":"sprite1313","x":704,"y":128,"width":64,"height":64},
  {"name":"sprite1314","x":768,"y":128,"width":64,"height":64},
  {"name":"sprite1315","x":832,"y":128,"width":64,"height":64},
  {"name":"sprite1316","x":896,"y":128,"width":64,"height":64},
  {"name":"sprite1317","x":960,"y":128,"width":64,"height":64},
  {"name":"sprite1318","x":0,"y":192,"width":64,"height":64},
  {"name":"sprite1319","x":64,"y":192,"width":64,"height":64},
  {"name":"sprite1320","x":128,"y":192,"width":64,"height":64},
  {"name":"sprite1321","x":192,"y":192,"width":64,"height":64},
  {"name":"sprite1322","x":256,"y":192,"width":64,"height":64},
  {"name":"sprite1323","x":320,"y":192,"width":64,"height":64},
  {"name":"sprite1324","x":384,"y":192,"width":64,"height":64},
  {"name":"sprite1325","x":448,"y":192,"width":64,"height":64},
  {"name":"sprite1326","x":512,"y":192,"width":64,"height":64},
  {"name":"sprite1327","x":576,"y":192,"width":64,"height":64},
  {"name":"sprite1328","x":640,"y":192,"width":64,"height":64},
  {"name":"sprite1329","x":704,"y":192,"width":64,"height":64},
  {"name":"sprite1330","x":768,"y":192,"width":64,"height":64},
  {"name":"sprite1331","x":832,"y":192,"width":64,"height":64},
  {"name":"sprite1332","x":896,"y":192,"width":64,"height":64},
  {"name":"sprite1333","x":960,"y":192,"width":64,"height":64},
  {"name":"sprite1334","x":0,"y":256,"width":64,"height":64},
  {"name":"sprite1335","x":64,"y":256,"width":64,"height":64},
  {"name":"sprite1336","x":128,"y":256,"width":64,"height":64},
  {"name":"sprite1337","x":192,"y":256,"width":64,"height":64},
  {"name":"sprite1338","x":256,"y":256,"width":64,"height":64},
  {"name":"sprite1339","x":320,"y":256,"width":64,"height":64},
  {"name":"sprite1340","x":384,"y":256,"width":64,"height":64},
  {"name":"sprite1341","x":448,"y":256,"width":64,"height":64},
  {"name":"sprite1342","x":512,"y":256,"width":64,"height":64},
  {"name":"sprite1343","x":576,"y":256,"width":64,"height":64},
  {"name":"sprite1344","x":640,"y":256,"width":64,"height":64},
  {"name":"sprite1345","x":704,"y":256,"width":64,"height":64},
  {"name":"sprite1346","x":768,"y":256,"width":64,"height":64},
  {"name":"sprite1347","x":832,"y":256,"width":64,"height":64},
  {"name":"sprite1348","x":896,"y":256,"width":64,"height":64},
  {"name":"sprite1349","x":960,"y":256,"width":64,"height":64},
  {"name":"sprite1350","x":0,"y":320,"width":64,"height":64},
  {"name":"sprite1351","x":64,"y":320,"width":64,"height":64},
  {"name":"sprite1352","x":128,"y":320,"width":64,"height":64},
  {"name":"sprite1353","x":192,"y":320,"width":64,"height":64},
  {"name":"sprite1354","x":256,"y":320,"width":64,"height":64},
  {"name":"sprite1355","x":320,"y":320,"width":64,"height":64},
  {"name":"sprite1356","x":384,"y":320,"width":64,"height":64},
  {"name":"sprite1357","x":448,"y":320,"width":64,"height":64},
  {"name":"sprite1358","x":512,"y":320,"width":64,"height":64},
  {"name":"sprite1359","x":576,"y":320,"width":64,"height":64},
  {"name":"sprite1360","x":640,"y":320,"width":64,"height":64},
  {"name":"sprite1361","x":704,"y":320,"width":64,"height":64},
  {"name":"sprite1362","x":768,"y":320,"width":64,"height":64},
  {"name":"sprite1363","x":832,"y":320,"width":64,"height":64},
  {"name":"sprite1364","x":896,"y":320,"width":64,"height":64},
  {"name":"sprite1365","x":960,"y":320,"width":64,"height":64},
  {"name":"sprite1366","x":0,"y":384,"width":64,"height":64},
  {"name":"sprite1367","x":64,"y":384,"width":64,"height":64},
  {"name":"sprite1368","x":128,"y":384,"width":64,"height":64},
  {"name":"sprite1369","x":192,"y":384,"width":64,"height":64},
  {"name":"sprite1370","x":256,"y":384,"width":64,"height":64},
  {"name":"sprite1371","x":320,"y":384,"width":64,"height":64},
  {"name":"sprite1372","x":384,"y":384,"width":64,"height":64},
  {"name":"sprite1373","x":448,"y":384,"width":64,"height":64},
  {"name":"sprite1374","x":512,"y":384,"width":64,"height":64},
  {"name":"sprite1375","x":576,"y":384,"width":64,"height":64},
  {"name":"sprite1376","x":640,"y":384,"width":64,"height":64},
  {"name":"sprite1377","x":768,"y":384,"width":64,"height":64},
  {"name":"sprite1378","x":832,"y":384,"width":64,"height":64},
  {"name":"sprite1379","x":896,"y":384,"width":64,"height":64},
  {"name":"sprite1380","x":960,"y":384,"width":64,"height":64},
  {"name":"sprite1381","x":0,"y":448,"width":64,"height":64},
  {"name":"sprite1382","x":64,"y":448,"width":64,"height":64},
  {"name":"sprite1383","x":128,"y":448,"width":64,"height":64},
  {"name":"sprite1384","x":192,"y":448,"width":64,"height":64},
  {"name":"sprite1385","x":256,"y":448,"width":64,"height":64},
  {"name":"sprite1386","x":320,"y":448,"width":64,"height":64},
  {"name":"sprite1387","x":384,"y":448,"width":64,"height":64},
  {"name":"sprite1388","x":448,"y":448,"width":64,"height":64},
  {"name":"sprite1389","x":512,"y":448,"width":64,"height":64},
  {"name":"sprite1390","x":576,"y":448,"width":64,"height":64},
  {"name":"sprite1391","x":640,"y":448,"width":64,"height":64},
  {"name":"sprite1392","x":704,"y":448,"width":64,"height":64},
  {"name":"sprite1393","x":768,"y":448,"width":64,"height":64},
  {"name":"sprite1394","x":832,"y":448,"width":64,"height":64},
  {"name":"sprite1395","x":896,"y":448,"width":64,"height":64},
  {"name":"sprite1396","x":960,"y":448,"width":64,"height":64},
  {"name":"sprite1397","x":0,"y":512,"width":64,"height":64},
  {"name":"sprite1398","x":64,"y":512,"width":64,"height":64},
  {"name":"sprite1399","x":128,"y":512,"width":64,"height":64},
  {"name":"sprite1400","x":192,"y":512,"width":64,"height":64},
  {"name":"sprite1401","x":256,"y":512,"width":64,"height":64},
  {"name":"sprite1402","x":320,"y":512,"width":64,"height":64},
  {"name":"sprite1403","x":384,"y":512,"width":64,"height":64},
  {"name":"sprite1404","x":448,"y":512,"width":64,"height":64},
  {"name":"sprite1405","x":512,"y":512,"width":64,"height":64},
  {"name":"sprite1406","x":576,"y":512,"width":64,"height":64},
  {"name":"sprite1407","x":640,"y":512,"width":64,"height":64},
  {"name":"sprite1408","x":704,"y":512,"width":64,"height":64},
  {"name":"sprite1409","x":768,"y":512,"width":64,"height":64},
  {"name":"sprite1410","x":832,"y":512,"width":64,"height":64},
  {"name":"sprite1411","x":896,"y":512,"width":64,"height":64},
  {"name":"sprite1412","x":960,"y":512,"width":64,"height":64},
  {"name":"sprite1413","x":0,"y":576,"width":64,"height":64},
  {"name":"sprite1414","x":64,"y":576,"width":64,"height":64},
  {"name":"sprite1415","x":128,"y":576,"width":64,"height":64},
  {"name":"sprite1416","x":192,"y":576,"width":64,"height":64},
  {"name":"sprite1417","x":256,"y":576,"width":64,"height":64},
  {"name":"sprite1418","x":320,"y":576,"width":64,"height":64},
  {"name":"sprite1419","x":384,"y":576,"width":64,"height":64},
  {"name":"sprite1420","x":448,"y":576,"width":64,"height":64},
  {"name":"sprite1421","x":512,"y":576,"width":64,"height":64},
  {"name":"sprite1422","x":576,"y":576,"width":64,"height":64},
  {"name":"sprite1423","x":640,"y":576,"width":64,"height":64},
  {"name":"sprite1424","x":704,"y":576,"width":64,"height":64},
  {"name":"sprite1425","x":768,"y":576,"width":64,"height":64},
  {"name":"sprite1426","x":832,"y":576,"width":64,"height":64},
  {"name":"sprite1427","x":896,"y":576,"width":64,"height":64},
  {"name":"sprite1428","x":960,"y":576,"width":64,"height":64},
  {"name":"sprite1429","x":0,"y":640,"width":64,"height":64},
  {"name":"sprite1430","x":64,"y":640,"width":64,"height":64},
  {"name":"sprite1431","x":128,"y":640,"width":64,"height":64},
  {"name":"sprite1432","x":192,"y":640,"width":64,"height":64},
  {"name":"sprite1433","x":256,"y":640,"width":64,"height":64},
  {"name":"sprite1434","x":320,"y":640,"width":64,"height":64},
  {"name":"sprite1435","x":384,"y":640,"width":64,"height":64},
  {"name":"sprite1436","x":448,"y":640,"width":64,"height":64},
  {"name":"sprite1437","x":512,"y":640,"width":64,"height":64},
  {"name":"sprite1438","x":576,"y":640,"width":64,"height":64},
  {"name":"sprite1439","x":640,"y":640,"width":64,"height":64},
  {"name":"sprite1440","x":704,"y":640,"width":64,"height":64},
  {"name":"sprite1441","x":768,"y":640,"width":64,"height":64},
  {"name":"sprite1442","x":832,"y":640,"width":64,"height":64},
  {"name":"sprite1443","x":896,"y":640,"width":64,"height":64},
  {"name":"sprite1444","x":960,"y":640,"width":64,"height":64},
  {"name":"sprite1445","x":0,"y":704,"width":64,"height":64},
  {"name":"sprite1446","x":64,"y":704,"width":64,"height":64},
  {"name":"sprite1447","x":128,"y":704,"width":64,"height":64},
  {"name":"sprite1448","x":192,"y":704,"width":64,"height":64},
  {"name":"sprite1449","x":256,"y":704,"width":64,"height":64},
  {"name":"sprite1450","x":320,"y":704,"width":64,"height":64},
  {"name":"sprite1451","x":384,"y":704,"width":64,"height":64},
  {"name":"sprite1452","x":448,"y":704,"width":64,"height":64},
  {"name":"sprite1453","x":512,"y":704,"width":64,"height":64},
  {"name":"sprite1454","x":576,"y":704,"width":64,"height":64},
  {"name":"sprite1455","x":640,"y":704,"width":64,"height":64},
  {"name":"sprite1456","x":704,"y":704,"width":64,"height":64},
  {"name":"sprite1457","x":768,"y":704,"width":64,"height":64},
  {"name":"sprite1458","x":832,"y":704,"width":64,"height":64},
  {"name":"sprite1459","x":896,"y":704,"width":64,"height":64},
  {"name":"sprite1460","x":960,"y":704,"width":64,"height":64},
  {"name":"sprite1461","x":0,"y":768,"width":64,"height":64},
  {"name":"sprite1462","x":64,"y":768,"width":64,"height":64},
  {"name":"sprite1463","x":128,"y":768,"width":64,"height":64},
  {"name":"sprite1464","x":192,"y":768,"width":64,"height":64},
  {"name":"sprite1465","x":256,"y":768,"width":64,"height":64},
  {"name":"sprite1466","x":320,"y":768,"width":64,"height":64},
  {"name":"sprite1467","x":384,"y":768,"width":64,"height":64},
  {"name":"sprite1468","x":448,"y":768,"width":64,"height":64},
  {"name":"sprite1469","x":512,"y":768,"width":64,"height":64},
  {"name":"sprite1470","x":576,"y":768,"width":64,"height":64},
  {"name":"sprite1471","x":640,"y":768,"width":64,"height":64},
  {"name":"sprite1472","x":704,"y":768,"width":64,"height":64},
  {"name":"sprite1473","x":768,"y":768,"width":64,"height":64},
  {"name":"sprite1474","x":832,"y":768,"width":64,"height":64},
  {"name":"sprite1475","x":896,"y":768,"width":64,"height":64},
  {"name":"sprite1476","x":960,"y":768,"width":64,"height":64},
  {"name":"sprite1477","x":0,"y":832,"width":64,"height":64},
  {"name":"sprite1478","x":64,"y":832,"width":64,"height":64},
  {"name":"sprite1479","x":128,"y":832,"width":64,"height":64},
  {"name":"sprite1480","x":192,"y":832,"width":64,"height":64},
  {"name":"sprite1481","x":256,"y":832,"width":64,"height":64},
  {"name":"sprite1482","x":320,"y":832,"width":64,"height":64},
  {"name":"sprite1483","x":384,"y":832,"width":64,"height":64},
  {"name":"sprite1484","x":448,"y":832,"width":64,"height":64},
  {"name":"sprite1485","x":512,"y":832,"width":64,"height":64},
  {"name":"sprite1486","x":576,"y":832,"width":64,"height":64},
  {"name":"sprite1487","x":640,"y":832,"width":64,"height":64},
  {"name":"sprite1488","x":704,"y":832,"width":64,"height":64},
  {"name":"sprite1489","x":768,"y":832,"width":64,"height":64},
  {"name":"sprite1490","x":832,"y":832,"width":64,"height":64},
  {"name":"sprite1491","x":896,"y":832,"width":64,"height":64},
  {"name":"sprite1492","x":960,"y":832,"width":64,"height":64},
  {"name":"sprite1493","x":0,"y":896,"width":64,"height":64},
  {"name":"sprite1494","x":64,"y":896,"width":64,"height":64},
  {"name":"sprite1495","x":128,"y":896,"width":64,"height":64},
  {"name":"sprite1496","x":192,"y":896,"width":64,"height":64},
  {"name":"sprite1497","x":256,"y":896,"width":64,"height":64},
  {"name":"sprite1498","x":320,"y":896,"width":64,"height":64},
  {"name":"sprite1499","x":384,"y":896,"width":64,"height":64},
  {"name":"sprite1500","x":448,"y":896,"width":64,"height":64},
  {"name":"sprite1501","x":512,"y":896,"width":64,"height":64},
  {"name":"sprite1502","x":576,"y":896,"width":64,"height":64},
  {"name":"sprite1503","x":640,"y":896,"width":64,"height":64},
  {"name":"sprite1504","x":704,"y":896,"width":64,"height":64},
  {"name":"sprite1505","x":768,"y":896,"width":64,"height":64},
  {"name":"sprite1506","x":832,"y":896,"width":64,"height":64},
  {"name":"sprite1507","x":896,"y":896,"width":64,"height":64},
  {"name":"sprite1508","x":960,"y":896,"width":64,"height":64},
  {"name":"sprite1509","x":0,"y":960,"width":64,"height":64},
  {"name":"sprite1510","x":64,"y":960,"width":64,"height":64},
  {"name":"sprite1511","x":128,"y":960,"width":64,"height":64},
  {"name":"sprite1512","x":192,"y":960,"width":64,"height":64},
  {"name":"sprite1513","x":256,"y":960,"width":64,"height":64},
  {"name":"sprite1514","x":320,"y":960,"width":64,"height":64},
  {"name":"sprite1515","x":384,"y":960,"width":64,"height":64},
  {"name":"sprite1516","x":448,"y":960,"width":64,"height":64},
  {"name":"sprite1517","x":512,"y":960,"width":64,"height":64},
  {"name":"sprite1518","x":576,"y":960,"width":64,"height":64},
  {"name":"sprite1519","x":640,"y":960,"width":64,"height":64},
  {"name":"sprite1520","x":704,"y":960,"width":64,"height":64},
  {"name":"sprite1521","x":768,"y":960,"width":64,"height":64},
  {"name":"sprite1522","x":832,"y":960,"width":64,"height":64},
  {"name":"sprite1523","x":896,"y":960,"width":64,"height":64},
  {"name":"sprite1524","x":960,"y":960,"width":64,"height":64},
  {"name":"sprite1525","x":0,"y":1024,"width":64,"height":64},
  {"name":"sprite1526","x":64,"y":1024,"width":64,"height":64},
  {"name":"sprite1527","x":128,"y":1024,"width":64,"height":64},
  {"name":"sprite1528","x":192,"y":1024,"width":64,"height":64},
  {"name":"sprite1529","x":256,"y":1024,"width":64,"height":64},
  {"name":"sprite1530","x":320,"y":1024,"width":64,"height":64},
  {"name":"sprite1531","x":384,"y":1024,"width":64,"height":64},
  {"name":"sprite1532","x":448,"y":1024,"width":64,"height":64},
  {"name":"sprite1533","x":512,"y":1024,"width":64,"height":64},
  {"name":"sprite1534","x":576,"y":1024,"width":64,"height":64},
  {"name":"sprite1535","x":640,"y":1024,"width":64,"height":64},
  {"name":"sprite1536","x":704,"y":1024,"width":64,"height":64},
  {"name":"sprite1537","x":768,"y":1024,"width":64,"height":64},
  {"name":"sprite1538","x":832,"y":1024,"width":64,"height":64},
  {"name":"sprite1539","x":896,"y":1024,"width":64,"height":64},
  {"name":"sprite1540","x":960,"y":1024,"width":64,"height":64},
  {"name":"sprite1541","x":0,"y":1088,"width":64,"height":64},
  {"name":"sprite1542","x":64,"y":1088,"width":64,"height":64},
  {"name":"sprite1543","x":128,"y":1088,"width":64,"height":64},
  {"name":"sprite1544","x":192,"y":1088,"width":64,"height":64},
  {"name":"sprite1545","x":256,"y":1088,"width":64,"height":64},
  {"name":"sprite1546","x":320,"y":1088,"width":64,"height":64},
  {"name":"sprite1547","x":384,"y":1088,"width":64,"height":64},
  {"name":"sprite1548","x":448,"y":1088,"width":64,"height":64},
  {"name":"sprite1549","x":512,"y":1088,"width":64,"height":64},
  {"name":"sprite1550","x":576,"y":1088,"width":64,"height":64},
  {"name":"sprite1551","x":640,"y":1088,"width":64,"height":64},
  {"name":"sprite1552","x":704,"y":1088,"width":64,"height":64},
  {"name":"sprite1553","x":768,"y":1088,"width":64,"height":64},
  {"name":"sprite1554","x":832,"y":1088,"width":64,"height":64},
  {"name":"sprite1555","x":896,"y":1088,"width":64,"height":64},
  {"name":"sprite1556","x":960,"y":1088,"width":64,"height":64},
  {"name":"sprite1557","x":0,"y":1152,"width":64,"height":64},
  {"name":"sprite1558","x":64,"y":1152,"width":64,"height":64},
  {"name":"sprite1559","x":128,"y":1152,"width":64,"height":64},
  {"name":"sprite1560","x":192,"y":1152,"width":64,"height":64},
  {"name":"sprite1561","x":256,"y":1152,"width":64,"height":64},
  {"name":"sprite1562","x":320,"y":1152,"width":64,"height":64},
  {"name":"sprite1563","x":384,"y":1152,"width":64,"height":64},
  {"name":"sprite1564","x":448,"y":1152,"width":64,"height":64},
  {"name":"sprite1565","x":512,"y":1152,"width":64,"height":64},
  {"name":"sprite1566","x":576,"y":1152,"width":64,"height":64},
  {"name":"sprite1567","x":640,"y":1152,"width":64,"height":64},
  {"name":"sprite1568","x":704,"y":1152,"width":64,"height":64},
  {"name":"sprite1569","x":768,"y":1152,"width":64,"height":64},
  {"name":"sprite1570","x":832,"y":1152,"width":64,"height":64},
  {"name":"sprite1571","x":896,"y":1152,"width":64,"height":64},
  {"name":"sprite1572","x":960,"y":1152,"width":64,"height":64},
  {"name":"sprite1573","x":0,"y":1216,"width":64,"height":64},
  {"name":"sprite1574","x":64,"y":1216,"width":64,"height":64},
  {"name":"sprite1575","x":128,"y":1216,"width":64,"height":64},
  {"name":"sprite1576","x":192,"y":1216,"width":64,"height":64},
  {"name":"sprite1577","x":256,"y":1216,"width":64,"height":64},
  {"name":"sprite1578","x":320,"y":1216,"width":64,"height":64},
  {"name":"sprite1579","x":384,"y":1216,"width":64,"height":64},
  {"name":"sprite1580","x":448,"y":1216,"width":64,"height":64},
  {"name":"sprite1581","x":512,"y":1216,"width":64,"height":64},
  {"name":"sprite1582","x":576,"y":1216,"width":64,"height":64},
  {"name":"sprite1583","x":640,"y":1216,"width":64,"height":64},
  {"name":"sprite1584","x":704,"y":1216,"width":64,"height":64},
  {"name":"sprite1585","x":832,"y":1216,"width":64,"height":64},
  {"name":"sprite1586","x":896,"y":1216,"width":64,"height":64},
  {"name":"sprite1587","x":0,"y":1280,"width":64,"height":64},
  {"name":"sprite1588","x":64,"y":1280,"width":64,"height":64},
  {"name":"sprite1589","x":128,"y":1280,"width":64,"height":64},
  {"name":"sprite1590","x":192,"y":1280,"width":64,"height":64},
  {"name":"sprite1591","x":256,"y":1280,"width":64,"height":64},
  {"name":"sprite1592","x":320,"y":1280,"width":64,"height":64},
  {"name":"sprite1593","x":384,"y":1280,"width":64,"height":64},
  {"name":"sprite1594","x":448,"y":1280,"width":64,"height":64},
  {"name":"sprite1595","x":512,"y":1280,"width":64,"height":64},
  {"name":"sprite1596","x":576,"y":1280,"width":64,"height":64},
  {"name":"sprite1597","x":640,"y":1280,"width":64,"height":64},
  {"name":"sprite1598","x":704,"y":1280,"width":64,"height":64},
];

// --- Isometric projection constants ---
const ISO_TILE_WIDTH = 64;  // footprint width
const ISO_TILE_HEIGHT = 32; // footprint height (diamond)

// world grid size (just a demo)
const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

function isoToScreen(x: number, y: number, z = 0) {
  const sx = (x - y) * (ISO_TILE_WIDTH / 2);
  const sy = (x + y) * (ISO_TILE_HEIGHT / 2) - z * ISO_TILE_HEIGHT;
  return { x: sx, y: sy };
}

export default function PixiStage({ background = 0x111111 }: PixiStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let destroyed = false;
    let app: PIXI.Application | null = null;
    let world: PIXI.Container | null = null;
    let canvas: HTMLCanvasElement | null = null;

    // Pan/zoom state
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let worldStartX = 0;
    let worldStartY = 0;
    const MIN_ZOOM = 0.4;
    const MAX_ZOOM = 3.0;

    const handlePointerDown = (e: PointerEvent) => {
      if (!world || !canvas) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      worldStartX = world.x;
      worldStartY = world.y;
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!world || !isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      world.x = worldStartX + dx;
      world.y = worldStartY + dy;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!canvas) return;
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!world || !canvas || !app) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = world.scale.x;
      const worldX = (mouseX - world.x) / oldScale;
      const worldY = (mouseY - world.y) / oldScale;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      let newScale = oldScale * zoomFactor;
      newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));

      world.scale.set(newScale);
      world.x = mouseX - worldX * newScale;
      world.y = mouseY - worldY * newScale;
    };

    const initPixi = async () => {
      if (!containerRef.current) return;

      app = new PIXI.Application();
      await app.init({
        resizeTo: containerRef.current,
        backgroundColor: background,
        antialias: true,
      });

      if (!containerRef.current || destroyed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      canvas = app.canvas;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.style.touchAction = "none";

      containerRef.current.appendChild(canvas);

      // Load base tilesheet texture
      const baseTexture = (await PIXI.Assets.load(SPRITESHEET_URL)) as PIXI.Texture;
      const source = baseTexture.source;

      // Build individual tile textures from frames
      const textures: PIXI.Texture[] = SPRITE_FRAMES.map(
        (frame) =>
          new PIXI.Texture({
            source,
            frame: new PIXI.Rectangle(frame.x, frame.y, frame.width, frame.height),
          })
      );

      // World container
      world = new PIXI.Container();
      world.sortableChildren = true;
      world.scale.set(1);
      app.stage.addChild(world);

      // Simple demo map: 10x10 grid, cycling through textures
      let idx = 0;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const tex = textures[Math.floor(Math.random() * textures.length)];

          const sprite = new PIXI.Sprite(tex);
          sprite.anchor.set(0.5, 1); // bottom-center anchor (feet on tile)

          const { x: sx, y: sy } = isoToScreen(x, y, 0);
          sprite.x = sx;
          sprite.y = sy;

          sprite.zIndex = x + y;
          world.addChild(sprite);
        }
      }

      world.sortChildren();

      // Center world in view
      const centerX = (GRID_WIDTH - 1) / 2;
      const centerY = (GRID_HEIGHT - 1) / 2;
      const centerScreen = isoToScreen(centerX, centerY, 0);
      world.x = app.renderer.width / 2 - centerScreen.x;
      world.y = app.renderer.height / 2 - centerScreen.y;

      // Attach events
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointerleave", handlePointerUp);
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    };

    initPixi();

    return () => {
      destroyed = true;
      if (canvas) {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointerleave", handlePointerUp);
        canvas.removeEventListener("wheel", handleWheel);
      }
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, [background]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}
