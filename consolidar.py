#!/usr/bin/env python3
"""
Consolida todos os JSONs da pasta data/ em um único leads.json
Uso: python consolidar.py
"""

import json
import os
from pathlib import Path

# Pasta com os JSONs
DATA_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = DATA_DIR / "leads.json"

def consolidar():
    leads = []
    arquivos_lidos = 0
    
    if not DATA_DIR.exists():
        print(f"❌ Pasta {DATA_DIR} não encontrada")
        return
    
    # Lê todos os JSONs
    for arquivo in sorted(DATA_DIR.glob("*.json")):
        # Pula o próprio leads.json se já existir
        if arquivo.name == "leads.json":
            continue
            
        try:
            with open(arquivo, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Se for array, adiciona todos
            if isinstance(data, list):
                leads.extend(data)
            else:
                # Se for objeto único, adiciona
                data['_source'] = arquivo.name
                leads.append(data)
            
            arquivos_lidos += 1
            print(f"✓ {arquivo.name}")
            
        except Exception as e:
            print(f"✗ {arquivo.name}: {e}")
    
    if not leads:
        print("❌ Nenhum lead encontrado")
        return
    
    # Salva consolidado
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*40}")
    print(f"✅ Consolidado: {len(leads)} leads")
    print(f"📁 Arquivo: {OUTPUT_FILE}")
    print(f"📊 Arquivos lidos: {arquivos_lidos}")

if __name__ == "__main__":
    consolidar()
