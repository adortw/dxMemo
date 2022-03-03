
$(function () {
    let monCols = [["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"],
                    ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"],
                    ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"]];
    
    let events = {
        init: function () {
            console.log(cost);
            events.handleGridData(cost);
        },
        
        handleGridData: function (dbDatas) {
            let cols = [];
            // 定義 columns
            {
                cols = [{
                    caption: "Item",
                    //columns: [{
                    //    caption: "",
                    width: 70,
                    alignment: "center",
                    dataField: "CATE_NAME",
                    //}],
                }, {
                    caption: "Item1",
                    //columns: [{
                    //    caption: "",
                    width: 130,
                    dataField: "FORMAT_NAME",
                    alignment: "center",
                    customizeText: function (cellInfo) {
                        return cellInfo.valueText.replace("\n", "<br/>");
                    },
                    encodeHtml: false,
                    //}],
                },
                ];
                //12個月columns & status
                $.each(monCols, function (i, obj) {
                    //console.log(obj)
                    let colYM = "" + obj[1] + "-2022";
                    cols.push({
                        caption: colYM,
                        columns: [{
                            caption: "plan",
                            dataField: obj[0] + "_PLAN_AMT",
                            width: 55,
                            dataType: "number",
                            alignment: "right",
                        }, {
                            caption: "actual",
                            dataField: obj[0] + "_ACTUAL_AMT",
                            width: 55,
                            dataType: "number",
                            alignment: "right",
                        }],
                    });
                });
                cols.push({
                    caption: "discount total",
                    dataField: "ROWSUM",
                    width: 70,
                    dataType: "number",
                    alignment: "right",
                    encodeHtml: false,
                });
            }

            // 定義 data source
            {
                //塞 折扣小計 
                {
                    dbDatas.forEach(function (item) {
                        item["ROWSUM"] = null;
                        if (item.SUB_TOTAL === "Y") {
                            let rowSum = 0;
                            $.each(monCols, function (i, obj) {
                                rowSum += item[obj[0] + "_ACTUAL_AMT"] == 0 ? item[obj[0] + "_PLAN_AMT"] : item[obj[0] + "_ACTUAL_AMT"]; //sum ACTUAL if actual沒有 則+PLAN
                            });
                            item["ROWSUM"] = rowSum;
                        }
                    });
                }
                //塞 折扣總計
                {
                    let reducer = function (previousValue, currentValue) { return previousValue + currentValue }; //累加function
                    let rowTotal = {
                        "CATE_NAME": "",
                        "FORMAT_NAME": "sum",
                        "GROUP2": 1, //合併判斷用
                    };
                    let rowSumTotal = 0;    //初始 折扣總計的小計
                    //滾12個月 ，分別挑出每個月的折扣後，各自加總組成最後一列
                    if (dbDatas.length > 0) {
                        $.each(monCols, function (i, obj) {
                            let planAmt = [];
                            let actualAmt = [];
                            //挑出 成本 "SUB_TOTAL" === "Y"
                            dbDatas.forEach(function (item) {
                                if (item["SUB_TOTAL"] === "Y") {
                                    //console.log(item);
                                    planAmt.push(item[obj[0] + "_PLAN_AMT"]);
                                    actualAmt.push(item[obj[0] + "_ACTUAL_AMT"]);
                                }
                            });
                            rowTotal[obj[0] + "_PLAN_AMT"] = planAmt.reduce(reducer);//reduce() 方法將一個累加器及陣列中每項元素（由左至右）傳入回呼函式，將陣列化為單一值。(js) //各月折扣陣列各自累加
                            rowTotal[obj[0] + "_ACTUAL_AMT"] = actualAmt.reduce(reducer);
                            rowSumTotal += rowTotal[obj[0] + "_ACTUAL_AMT"] == 0 ? rowTotal[obj[0] + "_PLAN_AMT"] : rowTotal[obj[0] + "_ACTUAL_AMT"];   //折扣總計的小計
                        });
                        //塞 折扣總計的小計
                        rowTotal["ROWSUM"] = rowSumTotal;

                        dbDatas.push(rowTotal);
                    }
                }
            }

            events.buildDG(dbDatas, cols);
        },

        buildDG: function (ds, cols) {

            $("#dxDG").dxDataGrid({
                dataSource: ds,
                showBorders: true,
                showRowLines: true,
                showColumnLines: true,
                sorting: {
                    mode: "none"
                },
                paging: { enabled: false },
                columns: cols,
                wordWrapEnabled: true,
                onCellPrepared: function (e) {
                    //header style
                    if (e.rowType == "header") {
                        //css 對齊設定!
                        e.cellElement.css("text-align", "center");
                        e.cellElement.css("vertical-align", "middle");
                    }
                    //data style
                    if (e.rowType == "data") {
                        //console.log(e);
                        //數值格式
                        if (e.columnIndex > 1) {
                            let formatValue = e.text;
                            if ((e.data["FORMAT_NAME"]).includes("point")) {
                                formatValue = "" + getNumberByUnit(e.value, 1, 4);
                            } else {
                                formatValue = getNumberByUnit(e.value, 1, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            }
                            if (e.value < 0)
                                formatValue = "(" + formatValue.substring(1) + ")";
                            e.cellElement[0].innerHTML = formatValue;  //innerHTML : 指定顯示在前端本文
                        }
                        //第一欄 合併儲存格
                        if (e.columnIndex == 0) {
                            if (e.data["GROUP2"] === 1) {
                                e.cellElement.attr("rowspan", getRowspan(ds, e.rowIndex));
                                e.cellElement.css("background-color", "#A6A6A6");
                            }
                            else {
                                e.cellElement.css("display", "none");
                            }
                        } else {
                            //每月折扣 row color                                     
                            if (e.data["SUB_TOTAL"] === "Y" || e.data["FORMAT_NAME"].substring(0, 6) === "discount") //["SUB_TOTAL"] === "Y": 每月折扣
                                e.cellElement.css("background-color", "#c6b6d6");
                            //負數紅字
                            if (e.value < 0)
                                e.cellElement.css("color", "red");
                        }
                    }

                },
            });
        },

    };

    events.init();

    //計算第一欄的垂直合併格數
    function getRowspan(ds, rowIndex) {
        let i = rowIndex;
        let rowSpan = 1;
        while (i < ds.length - 1 && ds[i].SUB_TOTAL !== "Y") { //ds.length-1 : 避險成本 不用算
            i++;
            rowSpan++;
        }
        return rowSpan;
    };
    //千位數逗號
    function thousandthComma(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    //格式化數字By單位、小數 ex:(1234500000, 1000000, 0) => 1235
    function getNumberByUnit(value, unit, point) {
        let absValue = Math.abs(value); //Math.abs取絕對值(去掉負號)，避免-0.015，四捨五入後變-0.01
        if (point == null)
            return value / unit;
        else {
            let multip = value < 0 ? -1 : 1;
            return +(Math.round((absValue / unit) + "e+" + point) + "e-" + point) * multip;
        }
    }

});

