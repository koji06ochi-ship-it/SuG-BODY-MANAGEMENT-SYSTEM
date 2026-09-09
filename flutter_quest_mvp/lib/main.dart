import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(const SugQuestApp());

class SugQuestApp extends StatelessWidget {
  const SugQuestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'S.u.G QUEST',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF080B0F),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE0B654),
          brightness: Brightness.dark,
        ),
        fontFamily: 'Hiragino Sans',
        useMaterial3: true,
      ),
      home: const QuestShell(),
    );
  }
}

class QuestSpot {
  const QuestSpot({
    required this.id,
    required this.name,
    required this.kind,
    required this.symbol,
    required this.position,
    required this.mission,
  });

  final String id;
  final String name;
  final SpotKind kind;
  final String symbol;
  final LatLng position;
  final String mission;
}

enum SpotKind { history, shrine, food, experience, manhole }

const tenmaCenter = LatLng(34.7017, 135.5119);

const spots = <QuestSpot>[
  QuestSpot(
    id: 'kunishige',
    name: '國重刃物店',
    kind: SpotKind.history,
    symbol: '刀',
    position: LatLng(34.6987, 135.5118),
    mission: '現地で刀剣・刃物の歴史展示を確認しよう。',
  ),
  QuestSpot(
    id: 'tenmangu',
    name: '大阪天満宮',
    kind: SpotKind.shrine,
    symbol: '鳥',
    position: LatLng(34.695530, 135.512634),
    mission: '境内でQUESTスポットを確認し、参拝後に達成しよう。',
  ),
  QuestSpot(
    id: 'ryo',
    name: '焼肉ホルモン瞭 天満店',
    kind: SpotKind.food,
    symbol: '肉',
    position: LatLng(34.7038, 135.5115),
    mission: '店舗到着を確認。対象メニュー・特典の案内を確認しよう。',
  ),
  QuestSpot(
    id: 'tsukushi',
    name: '天満つくし D-Wish',
    kind: SpotKind.experience,
    symbol: '蕎',
    position: LatLng(34.7045485, 135.5138264),
    mission: '店舗到着を確認。そば打ち体験QUESTの案内を確認しよう。',
  ),
  QuestSpot(
    id: 'manhole',
    name: 'マンホールSPOT',
    kind: SpotKind.manhole,
    symbol: '◎',
    position: LatLng(34.7022, 135.5144),
    mission: '現地のマンホール意匠を見つけて確認しよう。',
  ),
];

class QuestShell extends StatefulWidget {
  const QuestShell({super.key});

  @override
  State<QuestShell> createState() => _QuestShellState();
}

class _QuestShellState extends State<QuestShell> {
  final MapController _mapController = MapController();
  final Distance _distance = const Distance();
  StreamSubscription<Position>? _positionSub;

  int _tab = 0;
  LatLng? _user;
  QuestSpot _selected = spots.first;
  Set<String> _cards = <String>{};
  String _gpsMessage = 'GPSを確認中';

  @override
  void initState() {
    super.initState();
    _loadCards();
    _startLocation();
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }

  Future<void> _loadCards() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() => _cards = prefs.getStringList('sugQuestCards')?.toSet() ?? <String>{});
  }

  Future<void> _saveCard(String id) async {
    final prefs = await SharedPreferences.getInstance();
    _cards.add(id);
    await prefs.setStringList('sugQuestCards', _cards.toList());
    if (mounted) setState(() {});
  }

  Future<void> _startLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        setState(() => _gpsMessage = '位置情報サービスをONにしてください');
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() => _gpsMessage = '位置情報の許可が必要です');
        return;
      }

      final first = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _applyPosition(first, recenter: true);

      _positionSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      ).listen(_applyPosition);
    } catch (_) {
      if (mounted) setState(() => _gpsMessage = 'GPS取得に失敗しました');
    }
  }

  void _applyPosition(Position p, {bool recenter = false}) {
    final here = LatLng(p.latitude, p.longitude);
    if (!mounted) return;
    setState(() {
      _user = here;
      _gpsMessage = 'GPS LIVE';
      _selected = _nearestSpot(here);
    });
    if (recenter) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(here, 16.4);
      });
    }
  }

  QuestSpot _nearestSpot(LatLng here) {
    return spots.reduce((a, b) {
      final da = _distance.as(LengthUnit.Meter, here, a.position);
      final db = _distance.as(LengthUnit.Meter, here, b.position);
      return db < da ? b : a;
    });
  }

  int? _metersTo(QuestSpot spot) {
    if (_user == null) return null;
    return _distance.as(LengthUnit.Meter, _user!, spot.position).round();
  }

  bool _ready(QuestSpot spot) => (_metersTo(spot) ?? 999999) <= 180;

  Color _spotColor(QuestSpot spot) {
    return switch (spot.kind) {
      SpotKind.history => const Color(0xFF4F79C8),
      SpotKind.shrine => const Color(0xFFD64E43),
      SpotKind.food => const Color(0xFFED9136),
      SpotKind.experience => const Color(0xFF8C5BB7),
      SpotKind.manhole => const Color(0xFF5A6066),
    };
  }

  Future<void> _recenter() async {
    if (_user != null) {
      _mapController.move(_user!, 16.5);
      return;
    }
    await _startLocation();
  }

  Future<void> _openMission(QuestSpot spot) async {
    if (!_ready(spot)) {
      final m = _metersTo(spot);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(m == null ? 'GPS取得後に開始できます' : 'あと ${m}m。180m以内でQUEST開始できます。')),
      );
      return;
    }

    final got = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => MissionPage(spot: spot, alreadyGot: _cards.contains(spot.id))),
    );
    if (got == true) {
      await _saveCard(spot.id);
      if (!mounted) return;
      await Navigator.of(context).push<void>(
        MaterialPageRoute(builder: (_) => CardGetPage(spot: spot)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _buildMap(),
      QuestListPage(
        cards: _cards,
        distanceFor: _metersTo,
        onSelect: (spot) {
          setState(() {
            _selected = spot;
            _tab = 0;
          });
          WidgetsBinding.instance.addPostFrameCallback((_) => _mapController.move(spot.position, 16.8));
        },
      ),
      CollectionPage(cards: _cards),
      const PlaceholderPage(title: 'SHOP', message: '店舗特典・地域商品は実証後に接続'),
      MyPage(cards: _cards, gpsMessage: _gpsMessage),
    ];

    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        height: 72,
        backgroundColor: const Color(0xFF0B0F0D),
        indicatorColor: const Color(0xFF33280F),
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'MAP'),
          NavigationDestination(icon: Icon(Icons.flag_outlined), selectedIcon: Icon(Icons.flag), label: 'QUEST'),
          NavigationDestination(icon: Icon(Icons.style_outlined), selectedIcon: Icon(Icons.style), label: 'COLLECTION'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'SHOP'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'MY PAGE'),
        ],
      ),
    );
  }

  Widget _buildMap() {
    final m = _metersTo(_selected);
    final ready = _ready(_selected);
    final route = _user == null ? <LatLng>[] : <LatLng>[_user!, _selected.position];

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: const MapOptions(
            initialCenter: tenmaCenter,
            initialZoom: 16.2,
            minZoom: 13,
            maxZoom: 19,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'jp.sug.quest',
              maxNativeZoom: 19,
            ),
            if (_user != null)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: _user!,
                    useRadiusInMeter: true,
                    radius: 180,
                    color: const Color(0x223AB7FF),
                    borderColor: const Color(0xAA54C8FF),
                    borderStrokeWidth: 2,
                  ),
                ],
              ),
            if (route.isNotEmpty)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: route,
                    strokeWidth: 4,
                    color: const Color(0xFFE6B94E),
                    pattern: const StrokePattern.dotted(),
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                ...spots.map((spot) => Marker(
                      point: spot.position,
                      width: 105,
                      height: 104,
                      alignment: Alignment.bottomCenter,
                      child: GestureDetector(
                        onTap: () => setState(() => _selected = spot),
                        child: SpotMarker(
                          spot: spot,
                          color: _spotColor(spot),
                          selected: _selected.id == spot.id,
                          got: _cards.contains(spot.id),
                        ),
                      ),
                    )),
                if (_user != null)
                  Marker(
                    point: _user!,
                    width: 100,
                    height: 126,
                    alignment: Alignment.bottomCenter,
                    child: const PlayerMarker(),
                  ),
              ],
            ),
          ],
        ),
        const Positioned(
          left: 8,
          bottom: 8,
          child: Text('© OpenStreetMap contributors', style: TextStyle(fontSize: 8, color: Colors.black54)),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 24,
                  backgroundColor: Color(0xFF17202B),
                  child: Text('S', style: TextStyle(color: Color(0xFFFFD979), fontFamily: 'serif', fontSize: 24, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 9),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('S.u.G QUEST', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFFFD979))),
                      Text('歩くほど、好きなまちが見えてくる', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                _HudPill(icon: Icons.monetization_on, text: '${_cards.length * 100 + 1240}'),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: Container(
              margin: const EdgeInsets.only(top: 69, left: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: const Color(0xFFF9F0D9).withValues(alpha: .94),
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: const Color(0xFFB58834)),
              ),
              child: Text('📍 天満エリア   QUEST ${_cards.length} / ${spots.length}', style: const TextStyle(color: Color(0xFF35250C), fontWeight: FontWeight.w900, fontSize: 11)),
            ),
          ),
        ),
        Positioned(
          right: 14,
          bottom: 116,
          child: FloatingActionButton.small(
            heroTag: 'recenter',
            backgroundColor: const Color(0xFF121A21),
            foregroundColor: const Color(0xFFFFD979),
            onPressed: _recenter,
            child: const Icon(Icons.my_location),
          ),
        ),
        Positioned(
          left: 12,
          right: 78,
          bottom: 20,
          child: NextQuestCard(
            spot: _selected,
            meters: m,
            ready: ready,
            got: _cards.contains(_selected.id),
            onTap: () => _openMission(_selected),
          ),
        ),
      ],
    );
  }
}

class SpotMarker extends StatelessWidget {
  const SpotMarker({super.key, required this.spot, required this.color, required this.selected, required this.got});
  final QuestSpot spot;
  final Color color;
  final bool selected;
  final bool got;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          constraints: const BoxConstraints(maxWidth: 102),
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? const Color(0xFFE6B94E) : Colors.black54, width: selected ? 2 : 1),
          ),
          child: Text(spot.name, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900)),
        ),
        const SizedBox(height: 4),
        AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: selected ? 52 : 46,
          height: selected ? 52 : 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [BoxShadow(color: color.withValues(alpha: selected ? .55 : .3), blurRadius: selected ? 18 : 8)],
          ),
          child: Center(child: Text(got ? '✓' : spot.symbol, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900))),
        ),
      ],
    );
  }
}

class PlayerMarker extends StatelessWidget {
  const PlayerMarker({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        Container(
          width: 82,
          height: 34,
          margin: const EdgeInsets.only(bottom: 2),
          decoration: BoxDecoration(
            color: const Color(0x2249C9FF),
            borderRadius: BorderRadius.circular(50),
            border: Border.all(color: const Color(0xFF6ED9FF), width: 2),
            boxShadow: const [BoxShadow(color: Color(0x6659CEFF), blurRadius: 18, spreadRadius: 5)],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Image.asset(
            'assets/quest_avatar_chibi.png',
            width: 90,
            height: 112,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.shield, size: 74, color: Color(0xFFFFD979)),
          ),
        ),
      ],
    );
  }
}

class NextQuestCard extends StatelessWidget {
  const NextQuestCard({super.key, required this.spot, required this.meters, required this.ready, required this.got, required this.onTap});
  final QuestSpot spot;
  final int? meters;
  final bool ready;
  final bool got;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final meta = meters == null ? 'GPS取得中' : ready ? '${meters}m・GPS圏内' : 'あと ${meters}m';
    return Material(
      elevation: 10,
      color: const Color(0xFFF9F0D9),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFB78B34))),
          child: Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(color: const Color(0xFF221A0B), borderRadius: BorderRadius.circular(13)),
                child: Center(child: Text(got ? '✓' : spot.symbol, style: const TextStyle(color: Color(0xFFFFDF8B), fontSize: 26, fontWeight: FontWeight.bold))),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('NEXT QUEST', style: TextStyle(color: Color(0xFF796B52), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 2),
                    Text(spot.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF17130D), fontSize: 15, fontWeight: FontWeight.w900)),
                    Text(got ? 'CARD GET済み' : meta, style: TextStyle(color: got ? const Color(0xFF168744) : const Color(0xFF756C5E), fontSize: 10, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              CircleAvatar(
                radius: 21,
                backgroundColor: ready ? const Color(0xFF15904A) : const Color(0xFF1A1D1B),
                child: Icon(got ? Icons.check : Icons.chevron_right, color: ready ? Colors.white : const Color(0xFFFFD979)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HudPill extends StatelessWidget {
  const _HudPill({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 9),
        decoration: BoxDecoration(color: const Color(0xCC0E151D), borderRadius: BorderRadius.circular(30), border: Border.all(color: Colors.white24)),
        child: Row(children: [Icon(icon, color: const Color(0xFFE2B64E), size: 16), const SizedBox(width: 4), Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900))]),
      );
}

class MissionPage extends StatelessWidget {
  const MissionPage({super.key, required this.spot, required this.alreadyGot});
  final QuestSpot spot;
  final bool alreadyGot;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('MISSION')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('GPS CHECK CLEAR', style: TextStyle(color: Color(0xFF70E89A), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.4)),
              const SizedBox(height: 12),
              Text(spot.name, style: const TextStyle(color: Color(0xFFFFD979), fontSize: 29, fontWeight: FontWeight.w900)),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(color: const Color(0xFF11161D), borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFF70552A))),
                child: Text(spot.mission, style: const TextStyle(fontSize: 16, height: 1.7, fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: const Color(0xFFD6AA43), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: () => Navigator.pop(context, true),
                icon: Icon(alreadyGot ? Icons.refresh : Icons.check_circle),
                label: Text(alreadyGot ? 'もう一度クリアする' : 'MISSION CLEAR → CARD GET', style: const TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CardGetPage extends StatelessWidget {
  const CardGetPage({super.key, required this.spot});
  final QuestSpot spot;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('CARD GET', style: TextStyle(color: Color(0xFFFFD979), fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 3)),
                const SizedBox(height: 18),
                Container(
                  width: 250,
                  height: 370,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE3B84D), width: 2),
                    gradient: const LinearGradient(colors: [Color(0xFF36250B), Color(0xFF0A0A09)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                    boxShadow: const [BoxShadow(color: Color(0x5548C8FF), blurRadius: 34, spreadRadius: 3)],
                  ),
                  child: Column(
                    children: [
                      Text(spot.symbol, style: const TextStyle(fontSize: 92, color: Color(0xFFFFE3A0), fontWeight: FontWeight.bold)),
                      const Spacer(),
                      Text(spot.name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, color: Color(0xFFFFE3A0), fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      const Text('S.u.G QUEST / TENMA', style: TextStyle(fontSize: 9, color: Colors.white54, letterSpacing: 1.5)),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                FilledButton(onPressed: () => Navigator.pop(context), child: const Text('MAPへ戻る')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class QuestListPage extends StatelessWidget {
  const QuestListPage({super.key, required this.cards, required this.distanceFor, required this.onSelect});
  final Set<String> cards;
  final int? Function(QuestSpot) distanceFor;
  final ValueChanged<QuestSpot> onSelect;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QUEST')),
      body: ListView.separated(
        padding: const EdgeInsets.all(14),
        itemCount: spots.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final s = spots[i];
          final d = distanceFor(s);
          return ListTile(
            onTap: () => onSelect(s),
            tileColor: const Color(0xFF11151B),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: cards.contains(s.id) ? const Color(0xFF3EBB68) : const Color(0xFF5E4926))),
            leading: CircleAvatar(backgroundColor: const Color(0xFF20190C), child: Text(cards.contains(s.id) ? '✓' : s.symbol, style: const TextStyle(color: Color(0xFFFFD979), fontWeight: FontWeight.w900))),
            title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.w900)),
            subtitle: Text(d == null ? 'GPS取得中' : '${d}m'),
            trailing: const Icon(Icons.chevron_right),
          );
        },
      ),
    );
  }
}

class CollectionPage extends StatelessWidget {
  const CollectionPage({super.key, required this.cards});
  final Set<String> cards;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('COLLECTION  ${cards.length}/${spots.length}')),
      body: GridView.builder(
        padding: const EdgeInsets.all(14),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: .72, crossAxisSpacing: 10, mainAxisSpacing: 10),
        itemCount: spots.length,
        itemBuilder: (_, i) {
          final s = spots[i];
          final got = cards.contains(s.id);
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: got ? const Color(0xFFE1B34A) : Colors.white12),
              gradient: LinearGradient(colors: got ? const [Color(0xFF32230C), Color(0xFF0A0A09)] : const [Color(0xFF111216), Color(0xFF090A0C)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(got ? s.symbol : '？', style: TextStyle(fontSize: 66, color: got ? const Color(0xFFFFE09A) : Colors.white24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(got ? s.name : 'LOCKED', textAlign: TextAlign.center, style: TextStyle(color: got ? const Color(0xFFFFD979) : Colors.white38, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class MyPage extends StatelessWidget {
  const MyPage({super.key, required this.cards, required this.gpsMessage});
  final Set<String> cards;
  final String gpsMessage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('MY PAGE')),
      body: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CircleAvatar(radius: 44, backgroundColor: Color(0xFF1D1A11), child: Icon(Icons.shield, color: Color(0xFFFFD979), size: 48)),
            const SizedBox(height: 16),
            const Text('S.u.G QUEST MEMBER', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFFFD979), fontWeight: FontWeight.w900, letterSpacing: 1.2)),
            const SizedBox(height: 22),
            _stat('CARD', '${cards.length} / ${spots.length}'),
            _stat('POINT', '${1240 + cards.length * 100}'),
            _stat('GPS', gpsMessage),
          ],
        ),
      ),
    );
  }

  Widget _stat(String k, String v) => Container(
        margin: const EdgeInsets.only(bottom: 9),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(color: const Color(0xFF11151B), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF4F4228))),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(k, style: const TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)), Text(v, style: const TextStyle(color: Color(0xFFFFD979), fontWeight: FontWeight.w900))]),
      );
}

class PlaceholderPage extends StatelessWidget {
  const PlaceholderPage({super.key, required this.title, required this.message});
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, height: 1.6, color: Colors.white70)))),
      );
}
