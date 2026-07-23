/*
# Add antenna equipment columns to BTS table

1. Purpose
   Raffina i calcoli del link budget FWA utilizzando apparecchiature Ubiquiti LTU.
   Aggiunge colonne per il guadagno antenna, la sensibilità del ricevitore e le perdite di cavo
   lato BTS (stazione ripetitore). Il lato client (LTU LR) è hardware standardizzato e
   gestito come costante nella edge function.

2. New Columns on `bts`
   - `antenna_gain_dbi` (numeric, NOT NULL, DEFAULT 20) — Guadagno antenna BTS in dBi.
     Valori tipici: 16-22 dBi per antenna settore, fino a 29 dBi per dish.
   - `rx_sensitivity_dbm` (numeric, NOT NULL, DEFAULT -96) — Sensibilità ricevitore BTS in dBm.
     LTU Rocket tipicamente ~-96 dBm.
   - `cable_loss_db` (numeric, NOT NULL, DEFAULT 0.5) — Perdite cavo/connettori lato BTS in dB.

3. Security
   Nessuna modifica a RLS o policies. Le policies esistenti coprono già le nuove colonne.

4. Notes
   - I valori DEFAULT consentono alle BTS esistenti di funzionare immediatamente.
   - `tx_power_dbm` esiste già; il default andrà aggiornato a 29 (LTU Rocket max) via Admin UI.
*/

ALTER TABLE bts
  ADD COLUMN IF NOT EXISTS antenna_gain_dbi numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS rx_sensitivity_dbm numeric NOT NULL DEFAULT -96,
  ADD COLUMN IF NOT EXISTS cable_loss_db numeric NOT NULL DEFAULT 0.5;

COMMENT ON COLUMN bts.antenna_gain_dbi IS 'Guadagno antenna BTS (dBi). 16-22 settore, fino a 29 dish.';
COMMENT ON COLUMN bts.rx_sensitivity_dbm IS 'Sensibilità ricevitore BTS (dBm). LTU Rocket ~-96 dBm.';
COMMENT ON COLUMN bts.cable_loss_db IS 'Perdite cavo/connettori lato BTS (dB).';
