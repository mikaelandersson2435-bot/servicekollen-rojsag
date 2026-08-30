# Servicekollen Röjsåg v1.7

GitHub Pages-klar version med Supabase.

Nytt i v1.7:
- Serviceintervall per maskin (standard 90 dagar)
- Varning före service (standard 14 dagar)
- Automatisk status: OK, snart dags eller försenad
- Nästa servicedatum visas i översikt, maskinregister och admin

Kör `supabase-v1.7-update.sql` en gång i Supabase SQL Editor före uppladdning av v1.7.


## v1.7
Standard för nya maskiner: service var 30:e dag och varning 7 dagar före förfallodatum.
