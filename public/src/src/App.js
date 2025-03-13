import React, { useState } from 'react';

// 千葉県北西部の路線価データサンプル（実際には大規模なデータベースが必要）
const routePriceDatabase = {
  // 松戸市エリア
  '松戸市小金原': 77,
  '松戸市小金原1': 77,
  '松戸市小金原2': 77,
  '松戸市小金原3': 75,
  '松戸市小金原4': 73,
  '松戸市小金原5': 73,
  '松戸市小金原6': 71,
  '松戸市小金原7': 71,
  '松戸市小金原8': 70,
  '松戸市小金原9': 70,
  '松戸市小金': 85,
  '松戸市北小金': 83,
  '松戸市新松戸': 110,
  '松戸市松戸': 120,
  '松戸市馬橋': 82,
  '松戸市八柱': 80,
  '松戸市常盤平': 79,
  '松戸市五香': 78,
  '松戸市秋山': 70,
  '松戸市矢切': 75,
  '松戸市東松戸': 76,
  '松戸市上本郷': 80,
  '松戸市六高台': 76,
  '松戸市栄町': 79,
  '松戸市牧の原': 77,
  '松戸市二十世紀が丘': 83,
  '松戸市': 75,
  
  // 流山市エリア
  '流山市おおたかの森': 100,
  '流山市おおたかの森東': 95,
  '流山市おおたかの森西': 98,
  '流山市おおたかの森南': 95,
  '流山市おおたかの森北': 93,
  '流山市南流山': 94,
  '流山市流山': 85,
  '流山市流山セントラルパーク': 90,
  '流山市鰭ケ崎': 83,
  '流山市東初石': 82,
  '流山市西初石': 84,
  '流山市平和台': 82,
  '流山市向小金': 80,
  '流山市江戸川台': 84,
  '流山市加': 81,
  '流山市松ケ丘': 81,
  '流山市前ケ崎': 78,
  '流山市中': 79,
  '流山市': 82,
  
  // 柏市エリア
  '柏市柏': 135,
  '柏市柏の葉キャンパス': 105,
  '柏市豊四季': 98,
  '柏市旭町': 100,
  '柏市末広町': 95,
  '柏市若葉町': 92,
  '柏市あけぼの': 92,
  '柏市松葉町': 90,
  '柏市東上町': 93,
  '柏市緑台': 88,
  '柏市光ケ丘': 88,
  '柏市新柏': 85,
  '柏市増尾': 86,
  '柏市高田': 84,
  '柏市高柳': 83,
  '柏市南増尾': 85,
  '柏市逆井': 82,
  '柏市布施': 80,
  '柏市': 90
};

const PropertyValuationTool = () => {
  const [formData, setFormData] = useState({
    address: '', // 住所（検索用）
    area: '', // 面積（㎡）
    areaJapanese: '', // 面積（坪）
    routePrice: '', // 路線価（千円/㎡）
    routePriceMultiplier: '1.0', // 路線価倍率
    stationDistance: '', // 駅距離（分）
    landShape: '整形地', // 土地形状
    zoning: '第一種低層住居専用地域', // 用途地域
    existingBuilding: true, // 既存建物
    buildingArea: '', // 建物面積
    demolitionUnitPrice: '45', // 解体単価（千円/㎡）
    targetMargin: '15' // 目標利益率（%）
  });
  
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // 入力変更ハンドラ
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // ㎡から坪への自動変換
    if (name === 'area') {
      const areaValue = parseFloat(value) || 0;
      const tsubo = (areaValue / 3.30578).toFixed(2);
      setFormData(prev => ({ ...prev, areaJapanese: tsubo }));
    } else if (name === 'areaJapanese') {
      const tsuboValue = parseFloat(value) || 0;
      const sqm = (tsuboValue * 3.30578).toFixed(2);
      setFormData(prev => ({ ...prev, area: sqm }));
    }
  };
  
  // 査定計算
  const calculateValuation = () => {
    if (!formData.area || !formData.routePrice) {
      alert('面積と路線価は必須項目です');
      return;
    }
    
    // 基本データの準備
    const area = parseFloat(formData.area);
    const areaTsubo = parseFloat(formData.areaJapanese) || area / 3.30578;
    const routePrice = parseFloat(formData.routePrice);
    const routePriceMultiplier = parseFloat(formData.routePriceMultiplier) || 1.0;
    
    // 路線価からの基本評価額（円/㎡）
    const baseUnitPricePerSqm = routePrice * routePriceMultiplier * 1000; // 千円/㎡ → 円/㎡
    const baseUnitPricePerTsubo = baseUnitPricePerSqm * 3.30578 / 10000; // 円/㎡ → 万円/坪
    
    // 基本土地価格（万円）
    let landValue = baseUnitPricePerSqm * area / 10000; // 円 → 万円
    
    // 係数の計算
    let locationFactor = 1.0;
    const stationDistance = parseInt(formData.stationDistance) || 0;
    
    // 駅からの距離による係数調整
    if (stationDistance <= 5) locationFactor = 1.2;
    else if (stationDistance <= 10) locationFactor = 1.1;
    else if (stationDistance <= 15) locationFactor = 1.0;
    else if (stationDistance <= 20) locationFactor = 0.9;
    else locationFactor = 0.8;
    
    // 用途地域による係数調整
    let zoningFactor = 1.0;
    switch (formData.zoning) {
      case '商業地域': zoningFactor = 1.3; break;
      case '近隣商業地域': zoningFactor = 1.2; break;
      case '準住居地域':
      case '第二種住居地域': zoningFactor = 1.1; break;
      case '第一種住居地域': zoningFactor = 1.05; break;
      case '準工業地域': zoningFactor = 0.95; break;
      case '工業地域': zoningFactor = 0.9; break;
      case '工業専用地域': zoningFactor = 0.7; break;
      default: zoningFactor = 1.0;
    }
    
    // 土地形状による係数調整
    let shapeFactor = 1.0;
    switch (formData.landShape) {
      case '整形地': shapeFactor = 1.0; break;
      case 'セットバック必要': shapeFactor = 0.95; break;
      case '旗竿地': shapeFactor = 0.8; break;
      case '不整形地': shapeFactor = 0.85; break;
      default: shapeFactor = 1.0;
    }
    
    // 全ての係数を適用
    const adjustedLandValue = landValue * locationFactor * zoningFactor * shapeFactor;
    
    // 経費計算
    // 解体費用
    const demolitionCost = formData.existingBuilding ? 
      (parseFloat(formData.buildingArea) || 0) * (parseFloat(formData.demolitionUnitPrice) || 45) / 1000 : 0;
    
    // 諸経費（登記費用、税金など）
    const miscCost = adjustedLandValue * 0.05; // 仮に5%と設定
    
    // 取得原価合計
    const totalAcquisitionCost = adjustedLandValue + demolitionCost + miscCost;
    
    // 目標粗利益
    const targetMarginRate = parseFloat(formData.targetMargin) / 100;
    const targetMarginAmount = totalAcquisitionCost * targetMarginRate;
    
    // 販売想定価格
    const recommendedSellingPrice = totalAcquisitionCost + targetMarginAmount;
    
    // 出し値計算（建築条件付き土地としての適正価格）
    const suggestedBidLow = Math.round(adjustedLandValue * 0.8);
    const suggestedBidMedium = Math.round(adjustedLandValue * 0.85);
    const suggestedBidHigh = Math.round(adjustedLandValue * 0.9);
    
    // 坪単価計算
    const valuePerTsubo = Math.round(adjustedLandValue / areaTsubo);
    const sellingPricePerTsubo = Math.round(recommendedSellingPrice / areaTsubo);
    
    setResult({
      area,
      areaTsubo,
      routePrice,
      routePriceMultiplier,
      baseUnitPricePerTsubo,
      landValue,
      adjustedLandValue,
      locationFactor,
      zoningFactor,
      shapeFactor,
      demolitionCost,
      miscCost,
      totalAcquisitionCost,
      targetMarginAmount,
      recommendedSellingPrice,
      valuePerTsubo,
      sellingPricePerTsubo,
      suggestedBidLow,
      suggestedBidMedium,
      suggestedBidHigh
    });
    
    setShowResult(true);
  };
  
  // フォームリセット
  const resetForm = () => {
    setFormData({
      address: '',
      area: '',
      areaJapanese: '',
      routePrice: '',
      routePriceMultiplier: '1.0',
      stationDistance: '',
      landShape: '整形地',
      zoning: '第一種低層住居専用地域',
      existingBuilding: true,
      buildingArea: '',
      demolitionUnitPrice: '45',
      targetMargin: '15'
    });
    setResult(null);
    setShowResult(false);
  };
  
  // 結果画面を閉じる
  const closeResult = () => {
    setShowResult(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">土地簡易査定ツール</h1>
      
      {!showResult ? (
        <div className="space-y-4">
          {/* 入力フォーム */}
          <div className="p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 住所検索 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所（路線価検索用）
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="例：松戸市小金原2"
                    className="flex-grow p-2 border border-gray-300 rounded-l"
                  />
                  <button
                    onClick={() => {
                      // 住所から路線価を検索
                      const address = formData.address.trim();
                      if (address) {
                        // 最長一致で検索
                        const matchingAddresses = Object.keys(routePriceDatabase)
                          .filter(key => address.startsWith(key))
                          .sort((a, b) => b.length - a.length);
                        
                        if (matchingAddresses.length > 0) {
                          const bestMatch = matchingAddresses[0];
                          const price = routePriceDatabase[bestMatch];
                          setFormData({...formData, routePrice: price.toString()});
                          alert(`「${bestMatch}」の路線価: ${price}千円/㎡ を設定しました`);
                        } else {
                          alert('入力された住所の路線価データが見つかりませんでした');
                        }
                      } else {
                        alert('住所を入力してください');
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700"
                    type="button"
                  >
                    路線価検索
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">※松戸市・流山市・柏市エリア対応（データは2023年度路線価に基づく参考値）</p>
              </div>
              
              {/* 面積 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  面積（㎡）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  面積（坪）
                </label>
                <input
                  type="number"
                  name="areaJapanese"
                  value={formData.areaJapanese}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              {/* 路線価 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  路線価（千円/㎡）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="routePrice"
                  value={formData.routePrice}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  路線価倍率
                </label>
                <input
                  type="number"
                  name="routePriceMultiplier"
                  value={formData.routePriceMultiplier}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              {/* 駅距離 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  駅までの距離（徒歩分）
                </label>
                <input
                  type="number"
                  name="stationDistance"
                  value={formData.stationDistance}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              {/* 用途地域 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用途地域
                </label>
                <select
                  name="zoning"
                  value={formData.zoning}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="第一種低層住居専用地域">第一種低層住居専用地域</option>
                  <option value="第二種低層住居専用地域">第二種低層住居専用地域</option>
                  <option value="第一種住居地域">第一種住居地域</option>
                  <option value="第二種住居地域">第二種住居地域</option>
                  <option value="準住居地域">準住居地域</option>
                  <option value="近隣商業地域">近隣商業地域</option>
                  <option value="商業地域">商業地域</option>
                  <option value="準工業地域">準工業地域</option>
                  <option value="工業地域">工業地域</option>
                  <option value="工業専用地域">工業専用地域</option>
                </select>
              </div>
              
              {/* 土地形状 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  土地形状
                </label>
                <select
                  name="landShape"
                  value={formData.landShape}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="整形地">整形地</option>
                  <option value="セットバック必要">セットバック必要</option>
                  <option value="旗竿地">旗竿地</option>
                  <option value="不整形地">不整形地</option>
                </select>
              </div>
              
              {/* 既存建物 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  既存建物
                </label>
                <div className="flex items-center">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="existingBuilding"
                      checked={formData.existingBuilding}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="ml-1">あり（解体必要）</span>
                  </label>
                </div>
              </div>
              
              {/* 建物面積 */}
              <div className={!formData.existingBuilding ? "opacity-50" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  建物面積（㎡）
                </label>
                <input
                  type="number"
                  name="buildingArea"
                  value={formData.buildingArea}
                  onChange={handleChange}
                  disabled={!formData.existingBuilding}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              {/* 解体単価 */}
              <div className={!formData.existingBuilding ? "opacity-50" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  解体単価（千円/㎡）
                </label>
                <select
                  name="demolitionUnitPrice"
                  value={formData.demolitionUnitPrice}
                  onChange={handleChange}
                  disabled={!formData.existingBuilding}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="45">木造（45千円/㎡）</option>
                  <option value="70">S造（70千円/㎡）</option>
                  <option value="100">RC造（100千円/㎡）</option>
                </select>
              </div>
              
              {/* 目標利益率 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標利益率（%）
                </label>
                <input
                  type="number"
                  name="targetMargin"
                  value={formData.targetMargin}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          
          {/* ボタン */}
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={calculateValuation}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              査定する
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400"
            >
              リセット
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-center">査定結果</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">基本情報</h3>
              <p>面積: {result.area.toLocaleString()} ㎡（{result.areaTsubo.toLocaleString()} 坪）</p>
              <p>路線価: {result.routePrice.toLocaleString()} 千円/㎡（倍率: {result.routePriceMultiplier}）</p>
              <p>坪単価: {result.baseUnitPricePerTsubo.toLocaleString()} 万円/坪</p>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">評価係数</h3>
              <p>立地係数: {result.locationFactor.toFixed(2)}</p>
              <p>用途地域係数: {result.zoningFactor.toFixed(2)}</p>
              <p>土地形状係数: {result.shapeFactor.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">取得原価</h3>
              <p>評価額: {result.adjustedLandValue.toLocaleString()} 万円</p>
              <p>解体費: {result.demolitionCost.toLocaleString()} 万円</p>
              <p>諸経費: {result.miscCost.toLocaleString()} 万円</p>
              <p className="font-bold mt-2">取得原価合計: {result.totalAcquisitionCost.toLocaleString()} 万円</p>
            </div>
            
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">利益・販売価格</h3>
              <p>目標利益: {result.targetMarginAmount.toLocaleString()} 万円</p>
              <p className="font-bold">想定販売価格: {result.recommendedSellingPrice.toLocaleString()} 万円</p>
              <p>想定坪単価: {result.sellingPricePerTsubo.toLocaleString()} 万円/坪</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <h3 className="font-semibold mb-2">建築条件付き土地としての出し値目安</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-600">控えめ（80%）</p>
                <p className="text-xl font-bold text-red-600">{result.suggestedBidLow.toLocaleString()} 万円</p>
              </div>
              <div>
                <p className="text-gray-600">標準（85%）</p>
                <p className="text-xl font-bold text-green-600">{result.suggestedBidMedium.toLocaleString()} 万円</p>
              </div>
              <div>
                <p className="text-gray-600">積極的（90%）</p>
                <p className="text-xl font-bold text-blue-600">{result.suggestedBidHigh.toLocaleString()} 万円</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={closeResult}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              編集に戻る
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400"
            >
              新規査定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyValuationTool;
