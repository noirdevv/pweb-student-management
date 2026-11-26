# Pra-Praktikum Modul 4

## IP Addressing, Komunikasi Data & Routing Antar Subnet

### Pre-requisite

- a. GNS3 VM dan GNS3-GUI sudah terinstall
- b. Appliance `netics-pc`
- c. Appliance `MikroTik-CHR`

**Cakupan Modul:** Perhitungan VLSM dan perencanaan routing (pensil-kertas), static routing multi-hop, manipulasi route (summarization, longest prefix match, routing loop) dan troubleshooting, dynamic routing OSPF pada topologi ring dan backbone ganda, serta RIP.

> **Note:**
> - Bagian A dikerjakan di atas kertas dan menjadi acuan alamat untuk Bagian B, C, dan D. Cocokkan hasil Bagian A dengan Tabel Alokasi Acuan sebelum implementasi.
> - Setiap langkah yang meminta prediksi wajib dituliskan terlebih dahulu sebelum perintah dijalankan.
> - Tolong dipahami materi modul 4 dan modul-modul sebelumnya, karena copas saja tidak cukup.

---

## Pemetaan Node

| Node | Appliance | Peran | Digunakan di |
|---|---|---|---|
| R1, R2, R3 | MikroTik CHR | Router, masing-masing melayani satu ruang (R1: Ruang Dosen, R2: IF-105, R3: IF-106) | Bagian B, C, D |
| R4 | MikroTik CHR | Router yang melayani Ruang Baca | Bagian D |
| Lungmen | netics-pc | Host uji - Ruang Dosen | Bagian B, C, D |
| Laterano | netics-pc-desktop | Host uji dan client pengamatan (ping, mtr) - Ruang Dosen | Bagian B, C, D |
| Yan | netics-pc | Host uji - IF-105 | Bagian B, C, D |
| Kazdel | netics-pc | Host uji - IF-106 | Bagian B, C, D |
| Higashi | netics-pc | Host uji - Ruang Baca | Bagian D |
| Switch ruang | Ethernet switch | Penghubung host ke router ruang masing-masing | Bagian B, C, D |
| Switch Backbone A dan B | Ethernet switch | Penghubung seluruh router pada desain backbone ganda | Bagian D |

## Pemetaan Port Router

Fungsi setiap port dibakukan untuk seluruh router dan seluruh bagian, sehingga perpindahan topologi dilakukan dengan mengaktifkan atau menonaktifkan interface, bukan dengan menyusun ulang fungsi port.

| Port | Fungsi | Digunakan di |
|---|---|---|
| ether1 | LAN ruang (alamat ini menjadi default gateway host) | Bagian B, C, D |
| ether2 | Link point-to-point ke neighbor router pertama | Bagian B, C |
| ether3 | Link point-to-point ke neighbor router kedua | Bagian B (R2), C |
| ether4 | Backbone A | Bagian D |
| ether5 | Backbone B | Bagian D |

## Perintah CLI

| Kegiatan | CLI RouterOS v7 |
|---|---|
| IP address interface | `/ip address` |
| Routing table dan static route | `/ip route` |
| Status interface | `/interface` |
| OSPF | `/routing ospf instance \| area \| interface-template \| neighbor` |
| RIP | `/routing rip instance \| interface-template \| neighbor` |
| Ping dan traceroute | `/ping`, `/tool traceroute` |
| Log | `/log print` |

---

## A. Bagian A - Perencanaan: VLSM, Interface, dan Routing Table

### a. Tujuan Pembelajaran

1. Menerapkan metode VLSM untuk membagi satu alokasi alamat induk ke dalam segmen-segmen dengan kebutuhan host yang berbeda, termasuk segmen inter-router
2. Menyusun rencana alamat interface router serta routing table secara manual sebelum implementasi, termasuk mengenali peluang route summarization
3. Menghitung beban konfigurasi static routing seiring bertambahnya jumlah subnet, sebagai dasar penalaran perlunya dynamic routing

### b. Tools yang Dibutuhkan

1. Kalkulator manual (perhitungan biner/desimal)
2. Bagian ini tidak memerlukan topologi GNS3, seluruh proses merupakan perencanaan di atas kertas yang menjadi acuan bagi Bagian B, C, dan D
3. Pemahaman dasar addressing IPv4: prefix, network address, broadcast address, dan jumlah host valid

### c. Problem A.1 - Perhitungan VLSM untuk Seluruh Segmen

**Soal:**

Sebuah kompleks laboratorium memperoleh satu alokasi alamat `[IP Prefix].20.0/24` untuk melayani tiga ruang, yaitu Ruang Kelas IF-106 (±50 perangkat), Ruang Kelas IF-105 (±40 perangkat), dan Ruang Dosen (±10 perangkat). Router setiap ruang dihubungkan melalui tiga link point-to-point (R1–R2, R2–R3, dan R3–R1), serta melalui dua shared backbone segment (Backbone A dan Backbone B) yang dirancang dapat menampung hingga enam router. Sisa alokasi dicadangkan untuk penambahan Ruang Baca (±35 perangkat) pada Bagian D. Hitunglah pembagian VLSM untuk seluruh segmen tersebut.

**Langkah Kerja:**

1. Urutkan ke-delapan segmen berdasarkan kebutuhan host, dari yang terbesar menuju yang terkecil
2. Tentukan prefix minimum bagi tiap segmen dengan memilih prefix terbesar (blok terkecil) yang jumlah host validnya, yaitu `2^(32−prefix) − 2`, masih mencukupi kebutuhan
3. Alokasikan blok secara berurutan mulai dari `[IP Prefix].20.0`, tanpa tumpang tindih antar blok
4. Tentukan blok bagi Ruang Baca (±35 host) dari sisa alokasi, dengan memperhatikan bahwa network address suatu blok harus merupakan kelipatan ukuran blok tersebut

| No | Segmen | Kebutuhan Host | Prefix | Network Address | Broadcast Address |
|---|---|---|---|---|---|
| 1 | IF-106 | ±50 | | | |
| 2 | IF-105 | ±40 | | | |
| 3 | Ruang Dosen | ±10 | | | |
| 4 | Backbone A | hingga 6 router | | | |
| 5 | Backbone B | hingga 6 router | | | |
| 6 | Link R1–R2 | 2 | | | |
| 7 | Link R2–R3 | 2 | | | |
| 8 | Link R3–R1 | 2 | | | |
| 9 | Ruang Baca (cadangan) | ±35 | | | |

### d. Problem A.2 - Rencana Interface dan Routing Table: Chain Topology

**Soal:**

Pada tahap awal (Bagian B), ketiga router disusun dalam chain topology: R1 terhubung ke R2 melalui link R1–R2, dan R2 terhubung ke R3 melalui link R2–R3. Link R3–R1 belum dipasang. Susunlah rencana alamat setiap interface dan routing table yang seharusnya terbentuk pada setiap router.

**Langkah Kerja:**

1. Tentukan alamat ether1 setiap router sebagai alamat host pertama dari blok LAN ruangnya; alamat ini menjadi default gateway bagi host
2. Tentukan alamat ether2 dan ether3 sesuai link yang terhubung, dengan alamat host pertama pada link diberikan kepada router bernomor lebih kecil
3. Untuk setiap router, tentukan subnet yang bersifat directly connected, kemudian tentukan static route beserta next hop bagi subnet yang tidak directly connected
4. Periksa apakah terdapat dua static route pada satu router yang dapat di-summarize menjadi satu entri

### e. Tabel Alokasi Interface (rencana)

| Router | ether1 (LAN) | ether2 | ether3 |
|---|---|---|---|
| R1 | | | - (belum digunakan) |
| R2 | | | |
| R3 | | | - (belum digunakan) |

### f. Routing Table (rencana)

Metode dapat diisi seperti "Terhubung Langsung" atau "Static".

| Router | Destination Network | Next Hop | Outgoing Interface | Metode |
|---|---|---|---|---|
| R1 | Ruang Dosen | | | |
| R1 | Link R1–R2 | | | |
| R1 | IF-105 | | | |
| R1 | IF-106 | | | |
| R2 | IF-105 | | | |
| R2 | Link R1–R2 | | | |
| R2 | Link R2–R3 | | | |
| R2 | Ruang Dosen | | | |
| R2 | IF-106 | | | |
| R3 | IF-106 | | | |
| R3 | Link R2–R3 | | | |
| R3 | Ruang Dosen | | | |
| R3 | IF-105 | | | |

### g. Problem A.3 - Beban Konfigurasi Static Routing

**Soal:**

Pengelola jaringan perlu memperkirakan beban pengelolaan static routing apabila jumlah ruang terus bertambah. Diasumsikan setiap router melayani tepat satu LAN dan seluruh router saling terjangkau. Hitunglah jumlah static route yang diperlukan untuk berbagai jumlah router.

**Langkah Kerja:**

1. Untuk n router, hitung jumlah static route yang harus dipasang pada satu router, kemudian jumlah total pada seluruh router (tanpa summarization dan tanpa backup route)
2. Hitung kembali apabila setiap tujuan juga memerlukan satu backup route melalui alternate path
3. Tentukan berapa router yang konfigurasinya harus diubah ketika satu ruang baru ditambahkan

| Jumlah Router (n) | Static Route per Router | Total Tanpa Cadangan | Total Dengan Cadangan | Router yang Diubah saat Menambah 1 Ruang |
|---|---|---|---|---|
| 3 | | | | |
| 4 | | | | |
| 10 | | | | |
| n | | | | |

---

## B. Bagian B - Static Routing pada Chain Topology

### a. Tujuan Pembelajaran

1. Mengoperasikan router MikroTik untuk memberi alamat interface, membaca routing table, dan memasang static route
2. Memahami bahwa komunikasi inter-subnet memerlukan forward route dan return route di setiap router yang dilalui
3. Mengamati perubahan field TTL dan Header Checksum pada datagram IPv4 di setiap hop
4. Memanipulasi path datagram melalui route summarization, longest prefix match, dan routing loop
5. Mendiagnosis gangguan static routing secara sistematis

### b. Tools yang Dibutuhkan

1. GNS3 appliance MikroTik CHR (R1, R2, R3), `netics-pc`, dan `netics-pc-desktop`
2. GNS3 web console, Winbox (opsional), dan Wireshark melalui fitur capture link GNS3
3. Tabel Pemetaan Port Router dan Padanan Perintah CLI dan Menu Winbox di awal dokumen

### c. Tabel Alokasi Acuan

Tabel berikut merupakan alokasi acuan yang digunakan pada seluruh langkah kerja di Bagian B, C, dan D. Silakan diisi berdasarkan hasil perhitungan pada problem A.1 dan A.2, dan kolom alamat yang digunakan bisa menyesuaikan dengan menggunakan IP Prefix masing-masing.

| Segmen | Blok VLSM (/xx) | Alamat IP yang Digunakan |
|---|---|---|
| IF-106 | | R3 (ether1): `[...].1`<br>Kazdel (eth0): `[...].10` |
| IF-105 | | R2 (ether1): `[...].65`<br>Yan (eth0): `[...].70` |
| Ruang Dosen | | R1 (ether1): `[...].129`<br>Lungmen (eth0): `[...].130`<br>Laterano (eth0): `[...].131` |
| Backbone A | | R1: `[...].145`<br>R2: `[...].146`<br>R3: `[...].147`<br>R4: `[...].148`<br>(semua ether4) |
| Backbone B | | R1: `[...].153`<br>R2: `[...].154`<br>R3: `[...].155`<br>R4: `[...].156`<br>(semua ether5) |
| Link R1–R2 | | R1 (ether2): `[...].161`<br>R2 (ether2): `[...].162` |
| Link R2–R3 | | R2 (ether3): `[...].165`<br>R3 (ether2): `[...].166` |
| Link R3–R1 | | R1 (ether3): `[...].169`<br>R3 (ether3): `[...].170` |
| Ruang Baca | | R4 (ether1): `[...].193`<br>Higashi (eth0): `[...].200` |

### Skenario Topologi (Gambar B.1)

> *Gambar topologi tidak disertakan di README ini (lihat PDF asli).*
> Ruang Dosen (/28): Lungmen dan Laterano → Switch1 → R1 ether1.
> IF-105 (/26): Yan → Switch2 → R2 ether1.
> IF-106 (/26): Kazdel → Switch3 → R3 ether1.
> Link /30: R1 ether2 ↔ R2 ether2, dan R2 ether3 ↔ R3 ether2.

### d. Problem B.1 - Membangun Chain Topology dan Mengamati Connected Route

**Soal:**

Bangunlah topologi sesuai Gambar B.1. Seluruh router dimulai dari konfigurasi kosong, kemudian diberi identitas dan alamat interface sesuai Tabel Alokasi Acuan. Belum ada satu pun static route yang dipasang. Amati isi routing table awal dan uji konektivitas antar ruang.

**Langkah Kerja:**

1. Tambahkan tiga node MikroTik CHR, masing-masing dengan 5 network adapter, dan beri nama R1, R2, dan R3. Tambahkan switch serta host setiap ruang sesuai Gambar B.1
2. Sambungkan R1 ether2 ke R2 ether2, dan R2 ether3 ke R3 ether2. Sambungkan ether1 setiap router ke switch ruangnya
3. Pada setiap router, lakukan login pertama dan pastikan router dalam kondisi konfigurasi kosong, kemudian hapus DHCP client bawaan dan berikan identitas

   ```
   /ip dhcp-client remove [find]
   /system identity set name=R1   # R2 dan R3 menyesuaikan
   ```

4. Berikan alamat interface pada setiap router

   ```
   # R1
   /ip address
   add address=[...].129/28 interface=ether1 comment="LAN Ruang Dosen"
   add address=[...].161/30 interface=ether2 comment="link ke R2"

   # R2
   /ip address
   add address=[...].65/26 interface=ether1 comment="LAN IF-105"
   add address=[...].162/30 interface=ether2 comment="link ke R1"
   add address=[...].165/30 interface=ether3 comment="link ke R3"

   # R3
   /ip address
   add address=[...].1/26 interface=ether1 comment="LAN IF-106"
   add address=[...].166/30 interface=ether2 comment="link ke R2"
   ```

5. Konfigurasikan alamat dan default gateway pada setiap host

   ```
   # Lungmen
   ip addr add [...].130/28 dev eth0
   ip route add default via [...].129

   # Laterano
   ip addr add [...].131/28 dev eth0
   ip route add default via [...].129

   # Yan
   ip addr add [...].70/26 dev eth0
   ip route add default via [...].65

   # Kazdel
   ip addr add [...].10/26 dev eth0
   ip route add default via [...].1
   ```

6. Tampilkan routing table setiap router, kemudian bandingkan dengan baris bermetode *Directly Connected* pada rencana Problem A.2

   ```
   /ip route print
   ```

7. Sebelum melakukan ping, tuliskan dulu prediksi: apakah Laterano dapat menjangkau Yan? Tuliskan prediksi beserta alasannya, kemudian verifikasi

   ```
   $ ping -c 3 [...].162   # alamat R2 pada link R1–R2
   $ ping -c 3 [...].70    # Yan
   ```

| No | Parameter / Aspek | Field / Perintah | Hasil Observasi (screenshot) |
|---|---|---|---|
| 1 | Alamat interface R1, R2, R3 | `/ip address print` | |
| 2 | Routing table awal | `/ip route print` | |
| 3 | Hasil ping ke R2 (.162) | `ping` | |

### e. Problem B.2 - Static Route Multi-Hop, Forward dan Return Path, dan Anatomi Datagram

**Soal:**

Pasanglah static route sesuai rencana Problem A.2 agar ketiga ruang saling terjangkau. Pemasangan dilakukan secara bertahap untuk membuktikan bahwa return route sama pentingnya dengan forward route. Selanjutnya, amati perjalanan sebuah datagram di setiap hop melalui capture Wireshark.

**Langkah Kerja:**

1. Pasang static route pada R1 dan R2

   ```
   # R1
   /ip route
   add dst-address=[...].64/26 gateway=[...].162 comment="IF-105 via R2"
   add dst-address=[...].0/26 gateway=[...].162 comment="IF-106 via R2"

   # R2
   /ip route
   add dst-address=[...].128/28 gateway=[...].161 comment="Ruang Dosen via R1"
   add dst-address=[...].0/26 gateway=[...].166 comment="IF-106 via R3"
   ```

2. Sebelum melakukan ping, tuliskan dulu prediksi: R3 belum memiliki static route. Apakah ping dari Laterano menuju Kazdel berhasil? Pada router mana reply berhenti? Verifikasi dengan ping, kemudian dengan traceroute dari R3

   ```
   $ ping -c 3 [...].10

   # R3
   /tool traceroute [...].131
   ```

3. Lengkapi static route pada R3, kemudian ulangi pengujian

   ```
   # R3
   /ip route
   add dst-address=[...].128/28 gateway=[...].165 comment="Ruang Dosen via R2"
   add dst-address=[...].64/26 gateway=[...].165 comment="IF-105 via R2"
   ```

4. Verifikasi konektivitas dan path dari Laterano menuju Yan dan Kazdel, serta path arah sebaliknya dari Kazdel

   ```
   $ mtr -r -c 5 [...].70
   $ mtr -r -c 5 [...].10

   # Kazdel
   $ mtr -r -c 5 [...].131
   ```

5. Klik kanan link R1–R2 pada GNS3 dan pilih *Start capture*; lakukan hal yang sama pada link R2–R3 dan pada link antara switch Ruang Dosen dan R1. Gunakan filter berikut pada setiap jendela Wireshark

   ```
   icmp
   ```

6. Dari Laterano, kirimkan tiga ICMP Echo Request ke Kazdel, kemudian pada ketiga capture amati paket yang sama: nilai *Time to Live*, *Protocol*, dan *Header Checksum* pada bagian *Internet Protocol Version 4*

   ```
   $ ping -c 3 [...].10
   ```

| No | Parameter / Aspek | Field / Perintah | Hasil Observasi (screenshot) |
|---|---|---|---|
| 1 | Prediksi ping ke Kazdel sebelum R3 dikonfigurasi | - | |
| 2 | Hasil ping dan traceroute dari R3 | `ping`, `/tool traceroute` | |
| 3 | Routing table R1, R2, R3 lengkap | `/ip route print` | |
| 4 | Path Ruang Dosen → IF-105 | `mtr` | |
| 5 | Path Ruang Dosen → IF-106 | `mtr` | |
| 6 | Path IF-106 → Ruang Dosen | `mtr` | |
| 7 | TTL pada LAN Ruang Dosen, link R1–R2, link R2–R3 | `ip.ttl` | |
| 8 | Protocol dan Header Checksum pada ketiga capture | `ip.proto`, `ip.checksum` | |

### f. Problem B.3 - Manipulasi Route: Summarization, Longest Prefix Match, dan Routing Loop

**Soal:**

Setelah seluruh ruang saling terjangkau, path datagram dimanipulasi secara sengaja untuk memahami cara router memilih route. Setiap manipulasi diawali dengan prediksi dan diakhiri dengan pengembalian konfigurasi ke kondisi semula.

#### Langkah Kerja - (a) Route Summarization

1. Pada R1, gantikan dua static route menuju R2 dengan satu summary route hasil Problem A.2

   ```
   # R1
   /ip route remove [find where comment~"via R2"]
   /ip route add dst-address=[...].0/25 gateway=[...].162 comment="IF-105 dan IF-106 via R2 (summary)"
   /ip route print
   ```

2. Verifikasi bahwa Yan dan Kazdel tetap terjangkau dari Ruang Dosen. Summary route ini dipertahankan untuk Bagian C

#### Langkah Kerja - (b) Longest Prefix Match

1. Pada R1, tambahkan host route /32 menuju Kazdel dengan tipe blackhole. Tuliskan dulu prediksi tujuan mana yang tetap terjangkau: Kazdel (.10), R3 ether1 (.1), dan Yan (.70)

   ```
   # R1
   /ip route add dst-address=[...].10/32 blackhole comment="uji LPM"
   ```

2. Uji ketiga tujuan dari Laterano

   ```
   $ ping -c 3 [...].10
   $ ping -c 3 [...].1
   $ ping -c 3 [...].70
   ```

3. Hapus route uji tersebut setelah pengamatan selesai

   ```
   /ip route remove [find where comment="uji LPM"]
   ```

#### Langkah Kerja - (c) Routing Loop

1. Pastikan capture pada link R1–R2 masih berjalan. Pada R2, arahkan route menuju IF-106 kembali ke R1. Tuliskan dulu prediksi apa yang akan terjadi pada datagram yang dikirim dari Ruang Dosen menuju Kazdel

   ```
   # R2
   /ip route set [find where comment="IF-106 via R3"] gateway=[...].161
   ```

2. Kirimkan ping dari Laterano

   ```
   $ ping -c 2 [...].10
   ```

3. Pada capture link R1–R2, amati Echo Request yang sama berulang kali melintas dengan nilai TTL yang terus berkurang, hingga muncul ICMP message *Time-to-live exceeded*
4. Kembalikan konfigurasi R2 ke kondisi semula, kemudian verifikasi kembali konektivitas

   ```
   # R2
   /ip route set [find where comment="IF-106 via R3"] gateway=[...].166
   ```

> **Mengapa Route /32 Mengalahkan Route /25 dan /26?**
>
> Ketika lebih dari satu entri routing table mencakup destination address suatu datagram, router selalu memilih entri dengan prefix terpanjang (*longest prefix match*), karena entri tersebut paling spesifik. Host route /32 hanya mencakup satu alamat, sehingga hanya datagram menuju alamat tersebut yang terpengaruh, sedangkan alamat lain di blok yang sama tetap mengikuti route yang lebih umum. Prinsip ini memungkinkan pengecualian ditetapkan tanpa mengubah route utama.

| No | Parameter / Aspek | Field / Perintah | Hasil Observasi (screenshot) |
|---|---|---|---|
| 1 | Routing table R1 setelah summarization | `/ip route print` | |
| 2 | Konektivitas ke IF-105 dan IF-106 setelah summarization | `ping` | |
| 3 | Prediksi dan hasil uji LPM (.10, .1, .70) | `ping` | |
| 4 | Message yang diterima pengirim saat loop | `ping` | |
| 5 | Nilai TTL Echo Request yang sama pada capture R1–R2 | `ip.ttl` | |
| 6 | Konektivitas setelah konfigurasi dikembalikan | `ping` | |

---

## C. Bagian C - Redundansi dan Dynamic Routing OSPF pada Topologi Ring

### a. Tujuan Pembelajaran

1. Membuktikan keterbatasan static routing ketika jaringan memiliki redundant path dan salah satu link terputus
2. Memahami administrative distance sebagai dasar router memilih sumber route
3. Mengonfigurasi OSPF pada MikroTik RouterOS v7 dan memverifikasi neighbor serta route yang dibentuknya
4. Mengamati proses convergence OSPF dan mendiagnosis gangguan OSPF secara sistematis

### b. Tools yang Dibutuhkan

1. Topologi akhir Bagian B (summary route pada R1 tetap terpasang)
2. GNS3 web console, Winbox (opsional), `mtr` pada host, dan fitur *Suspend* link pada GNS3

### Skenario Topologi (Gambar C.1)

> *Gambar topologi tidak disertakan di README ini (lihat PDF asli).*
> Sama seperti Gambar B.1, ditambah link /30 langsung R1 ether3 ↔ R3 ether3, sehingga R1, R2, dan R3 membentuk ring.

### c. Problem C.1 - Redundant Link dengan Static Routing

**Soal:**

Pengelola jaringan menambahkan link langsung antara R3 dan R1 agar Ruang Dosen dan IF-106 memiliki path yang lebih pendek sekaligus backup path. Path baru ini terlebih dahulu dimanfaatkan dengan static routing, kemudian diuji ketika link tersebut terputus.

**Langkah Kerja:**

1. Sambungkan R1 ether3 ke R3 ether3, kemudian beri alamat

   ```
   # R1
   /ip address add address=[...].169/30 interface=ether3 comment="link ke R3"

   # R3
   /ip address add address=[...].170/30 interface=ether3 comment="link ke R1"
   ```

2. Pasang direct route pada kedua sisi. Pada R1, route /26 yang baru akan mengalahkan summary route /25 berdasarkan longest prefix match. Pada R3, route lama menuju Ruang Dosen memiliki prefix yang sama, sehingga diberi distance lebih besar agar menjadi backup route

   ```
   # R1
   /ip route add dst-address=[...].0/26 gateway=[...].170 comment="IF-106 langsung via R3"

   # R3
   /ip route set [find where comment="Ruang Dosen via R2"] distance=10
   /ip route add dst-address=[...].128/28 gateway=[...].169 comment="Ruang Dosen langsung via R1"
   ```

3. Verifikasi path Ruang Dosen ke IF-106 dan bandingkan jumlah hop dengan hasil Problem B.2

   ```
   $ mtr -r -c 5 [...].10
   ```

4. **Asymmetric path:** nonaktifkan sementara direct route pada R3, kemudian jalankan mtr dari kedua arah. Tuliskan dulu prediksi path yang ditempuh oleh masing-masing arah

   ```
   # R3
   /ip route disable [find where comment="Ruang Dosen langsung via R1"]

   $ mtr -r -c 5 [...].10    # dari Laterano
   $ mtr -r -c 5 [...].131   # dari Kazdel

   # R3
   /ip route enable [find where comment="Ruang Dosen langsung via R1"]
   ```

5. **Uji link failure:** jalankan ping berkelanjutan dari Laterano menuju Kazdel, kemudian klik kanan link R1–R3 pada GNS3 dan pilih *Suspend*. Tuliskan dulu prediksi apakah traffic akan berpindah melalui R2

   ```
   $ ping -O [...].10
   ```

6. Selama link dalam kondisi suspend, periksa status interface dan route pada R1

   ```
   # R1
   /interface print where name=ether3
   /ip route print where dst-address=[...].0/26
   ```

7. Pilih *Resume* pada link R1–R3. Aktifkan gateway check pada kedua direct route, kemudian ulangi uji link failure dan catat lamanya traffic terputus sebelum berpindah melalui R2

   ```
   # R1
   /ip route set [find where comment="IF-106 langsung via R3"] check-gateway=ping

   # R3
   /ip route set [find where comment="Ruang Dosen langsung via R1"] check-gateway=ping
   ```

### d. Problem C.2 - OSPF pada Topologi Ring

**Soal:**

Seluruh static route digantikan oleh OSPF. Setiap router hanya meng-advertise interface miliknya sendiri, dan routing table dibentuk secara otomatis melalui pertukaran informasi inter-router. Amati neighbor, route yang terbentuk, serta perilaku OSPF ketika salah satu link terputus.

**Langkah Kerja:**

1. Pada R1, R2, dan R3, hapus seluruh static route, kemudian pastikan routing table hanya berisi connected route

   ```
   /ip route remove [find where static]
   /ip route print
   ```

2. Konfigurasikan OSPF pada setiap router. Link inter-router menggunakan tipe point-to-point, sedangkan ether1 di-advertise sebagai passive interface agar tidak mengirim OSPF message ke arah host

   ```
   # R1 (R2: router-id=2.2.2.2, R3: router-id=3.3.3.3)
   /routing ospf instance add name=ospf1 version=2 router-id=1.1.1.1
   /routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf1
   /routing ospf interface-template
   add area=backbone interfaces=ether2,ether3 type=ptp comment="link inter-router"
   add area=backbone interfaces=ether1 passive comment="LAN"
   ```

3. Verifikasi neighbor, interface, dan route yang dibentuk OSPF

   ```
   /routing ospf neighbor print
   /routing ospf interface print
   /ip route print where ospf
   ```

4. Ulangi uji link failure R1–R3 seperti pada Problem C.1 sambil menjalankan ping berkelanjutan dari Laterano. Tuliskan dulu prediksi apakah traffic akan pulih dan berapa lama prosesnya, kemudian catat durasinya. Amati pula routing table R1 dan daftar neighbor selama link dalam kondisi suspend
5. Pilih *Resume* pada link R1–R3, kemudian amati kembalinya direct path

---

## D. Bagian D - Backbone Ganda dan Skalabilitas Dynamic Routing

### a. Tujuan Pembelajaran

1. Menerapkan OSPF pada shared backbone segment (broadcast) dan memahami peran Designated Router (DR) serta Backup Designated Router (BDR)
2. Mengamati load balancing melalui equal-cost path (ECMP) dan pemulihan ketika salah satu backbone tidak berfungsi
3. Membuktikan bahwa penambahan ruang baru pada dynamic routing hanya memerlukan konfigurasi pada router baru

### b. Tools yang Dibutuhkan

1. Topologi akhir Bagian C dengan OSPF berfungsi
2. Dua switch tambahan (Backbone A dan Backbone B), satu node MikroTik CHR tambahan (R4), dan satu `netics-pc` tambahan (Higashi)

### Skenario Topologi (Gambar D.1)

> *Gambar topologi tidak disertakan di README ini (lihat PDF asli).*
> R1 (Ruang Dosen, /28), R2 (IF-105, /26), R3 (IF-106, /26), dan R4 (Ruang Baca, /26) masing-masing terhubung ke SW-BackboneA melalui ether4 dan ke SW-BackboneB melalui ether5.

### c. Problem D.1 - Migrasi ke Backbone Ganda

**Soal:**

Desain jaringan kampus umumnya menghubungkan router setiap gedung ke kedua shared backbone, sehingga setiap router memiliki dua uplink tanpa memerlukan link khusus antar setiap pasangan router. Link point-to-point dari Bagian C dinonaktifkan dan digantikan oleh Backbone A dan Backbone B. Amati pemilihan DR/BDR, ECMP, dan pemulihan saat salah satu backbone terganggu.

**Langkah Kerja:**

1. Tambahkan switch Backbone A dan Backbone B. Sambungkan ether4 R1, R2, dan R3 ke Backbone A, serta ether5 ke Backbone B
2. Pada R1, R2, dan R3, nonaktifkan link point-to-point, berikan alamat backbone, dan tambahkan interface backbone ke OSPF

   ```
   # R1 (R2: .146 dan .154, R3: .147 dan .155)
   /interface disable ether2,ether3
   /ip address
   add address=[...].145/29 interface=ether4 comment="Backbone A"
   add address=[...].153/29 interface=ether5 comment="Backbone B"
   /routing ospf interface-template
   add area=backbone interfaces=ether4,ether5 comment="backbone ganda"
   ```

3. Verifikasi neighbor dan peran setiap router pada segmen backbone. Catat router yang menjadi DR dan BDR pada Backbone A dan Backbone B

   ```
   /routing ospf neighbor print
   /routing ospf interface print
   ```

4. Tuliskan dulu prediksi berapa gateway yang dimiliki R1 untuk menuju IF-106, kemudian verifikasi

   ```
   # R1
   /ip route print detail where dst-address=[...].0/26
   ```

5. Jalankan ping berkelanjutan dari Laterano menuju Kazdel, kemudian suspend link antara R3 dan Backbone A. Amati perubahan gateway pada R1 serta durasi downtime, kemudian resume link tersebut
6. Pada R1, ubah DR priority menjadi 0, kemudian nonaktifkan dan aktifkan kembali ether4 dan ether5 agar re-election terjadi. Amati perubahan peran R1

   ```
   /routing ospf interface-template set [find where comment="backbone ganda"] priority=0
   /interface disable ether4,ether5
   /interface enable ether4,ether5
   /routing ospf interface print
   ```

### d. Problem D.2 - Penambahan Ruang Baca melalui R4

**Soal:**

Ruang Baca (±35 perangkat) ditambahkan melalui router baru R4 yang terhubung ke kedua backbone. Konfigurasi R1, R2, dan R3 tidak boleh diubah sama sekali. Buktikan bahwa Ruang Baca dapat dijangkau dari seluruh ruang hanya dengan mengonfigurasi R4.

**Langkah Kerja:**

1. Sebelum implementasi, hitung di atas kertas: apabila jaringan ini menggunakan static routing dengan backup route melalui backbone kedua, berapa static route yang harus ditambahkan dan pada router mana saja?
2. Tambahkan R4 (MikroTik CHR, 5 adapter), switch Ruang Baca, dan Higashi sesuai Gambar D.1. Sambungkan ether1 ke switch Ruang Baca, ether4 ke Backbone A, dan ether5 ke Backbone B

   ```
   # R4
   /ip dhcp-client remove [find]
   /system identity set name=R4
   /ip address
   add address=[...].193/26 interface=ether1 comment="LAN Ruang Baca"
   add address=[...].148/29 interface=ether4 comment="Backbone A"
   add address=[...].156/29 interface=ether5 comment="Backbone B"
   /routing ospf instance add name=ospf1 version=2 router-id=4.4.4.4
   /routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf1
   /routing ospf interface-template
   add area=backbone interfaces=ether4,ether5 comment="backbone ganda"
   add area=backbone interfaces=ether1 passive comment="LAN"

   # Higashi
   ip addr add [...].200/26 dev eth0
   ip route add default via [...].193
   ```

3. Tanpa menyentuh konfigurasi R1, verifikasi bahwa R1 telah mengenal Ruang Baca, kemudian uji konektivitas dari Ruang Dosen

   ```
   # R1
   /ip route print where dst-address=[...].192/26

   $ mtr -r -c 5 [...].200
   ```

4. Simpan konfigurasi akhir setiap router sebagai bukti

   ```
   /export file=case4-R1   # R2, R3, R4 menyesuaikan
   ```

---

## E. Tugas Mandiri

### a. Sinopsis Tugas

Sebuah gedung baru memperoleh alokasi `[IP Prefix].50.0/24` untuk tiga ruang, yaitu Lab Jaringan (±60 host), Lab Sistem Cerdas (±25 host), dan Ruang Server (±6 host). Router RA, RB, dan RC yang melayani ketiga ruang tersebut disusun dalam chain topology RA–RB–RC dengan dua link point-to-point. Seluruh tahapan dikerjakan di atas kertas, tanpa GNS3, dengan menerapkan konsep Bagian A dan B.

### b. Soal

1. Hitung VLSM bagi kelima segmen (network address, broadcast address, dan rentang host valid)
2. Susun rencana alamat interface ketiga router dengan mengikuti Pemetaan Port Router (ether1 untuk LAN, ether2/ether3 untuk link point-to-point)
3. Susun routing table ketiga router (Destination Network, Next Hop, Interface, Metode), dan tandai route yang dapat di-summarize
4. Hitung jumlah static route tambahan apabila link RC–RA dipasang sebagai backup path, dan jelaskan alasan pemilihan dynamic routing untuk kondisi tersebut

### c. Tabel Perhitungan VLSM

| No | Parameter | Lab Jaringan (±60) | Lab Sistem Cerdas (±25) | Ruang Server (±6) | Link RA–RB | Link RB–RC |
|---|---|---|---|---|---|---|
| 1 | Prefix | | | | | |
| 2 | Network Address | | | | | |
| 3 | Broadcast Address | | | | | |
| 4 | Rentang Host Valid | | | | | |
