# wtc-exporter
### 用来查看以太坊WTC币交易情况

## 使用说明

推荐系统: Ubuntu 16.04

1. 安装nodejs和npm
2. 安装以太坊节点Geth [安装文档](https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu)
3. 运行`geth --syncmode=full`并完全同步数据（耗时很长的步骤）
4. 克隆项目: `git clone https://github.com/luoguohui234/wtc-explorer.git`
5. 安装mongodb [安装文档](https://docs.mongodb.com/getting-started/shell/tutorial/install-mongodb-on-ubuntu/)，启动mongodb后台服务`sudo service mongod start`
5. 安装项目依赖: `npm install`
7. 可选步骤: 
* 如果需要连接网络上的其它geth节点，使用`geth --syncmode=full --rpc --rpcaddr <ip> --rpcport <portnumber>`来启动geth并开启HTTP JSON-RPC服务
* 修改config.js的this.ipcPath和this.provider的定义为如下代码：
```javascript
this.provider = new web3.providers.HttpProvider("http://172.35.3.227:9999");
```
8. 启动程序: `npm start`
9. 在浏览器中访问 `http://localhost:3000`


## 数据库查看

程序将以太坊的数据导出到mongodb后，可以通过mongodb shell查看数据

1. 启动mongodb shell `mongo`
2. 查看所有数据库 `show dbs`
3. 选择数据库wtc `use wtc`
4. 查询各个集合的内容，例如查询balance集合 `db.balance.find()`

再举几个查询的例子

1. 查询某个账户的余额 
:	`db.balance.find({ _id: <address> })`
db.balance.find({ _id: "0x309a272885bdea62d99c4e32e40bee93a3ccef6a" })
输出结果：
{ "_id" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", "balance" : 3.5e+25 }
  
2. 查询某个账户每次交易后的余额 
:	`db.record.find({ account: <address> })`
db.record.find({ account: "0x309a272885bdea62d99c4e32e40bee93a3ccef6a" })
输出结果：
{ "_id" : ObjectId("5a97c93ce967911548fa15c7"), "account" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", "value" : 1000000000000000000, "balance" : 6.9999999e+25, "timestamp" : 1500614148 }
{ "_id" : ObjectId("5a97c93ce967911548fa15c9"), "account" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", "value" : 3.4999999e+25, "balance" : 3.5e+25, "timestamp" : 1500615265 }
  
3. 查询某个账户的事件日志记录 
:	`db.tx.find({$or: [{ "args._from": <address> }, { "args._to": <address> }] })`
db.tx.find({$or: [{ "args._from": "0x309a272885bdea62d99c4e32e40bee93a3ccef6a" }, { "args._to": "0x309a272885bdea62d99c4e32e40bee93a3ccef6a" }] })
输出结果：
{ "_id" : "4051681_13_6", "address" : "0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74", "blockNumber" : 4051681, "transactionHash" : "0xad3f4514c8156f6477d542300c72e88cf4c2f0b8018c8cd898d0282e51ff314a", "transactionIndex" : 13, "blockHash" : "0xe0684de81fcccc8068d48dfb2c538fff019d967cb7c17ab080a57a76fd5e596c", "logIndex" : 6, "removed" : false, "event" : "Transfer", "args" : { "_from" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", "_to" : "0x0e5a28725531d4c345f2e0a290fbf565f71ff30f", "_value" : 1000000000000000000 }, "timestamp" : 1500614148 }
{ "_id" : "4051732_32_14", "address" : "0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74", "blockNumber" : 4051732, "transactionHash" : "0xc05c68873b5d1639a46e7b12d3baf3c6df890ea60e2c7161315ffbf5e7c4334f", "transactionIndex" : 32, "blockHash" : "0x032f614399686b882aac21757486ae9fa7becedce312798743e992419cc1910e", "logIndex" : 14, "removed" : false, "event" : "Transfer", "args" : { "_from" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", "_to" : "0xbc77901baf141be56bc549332d404bade6be64ba", "_value" : 3.4999999e+25 }, "timestamp" : 1500615265 }
  


## 运行说明

程序启动后将自动读取以太坊的数据，将WTC的交易记录插入到mongodb中，需要大约三十分钟
程序将在mongodb中生成几个集合：

1. balance：存储每个账户的最终余额，集合中存储的字段如下：
* "_id" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a" _账户地址_
* "balance" : 3.5e+25 _账户余额_

2. record: 存储每笔交易后的账户余额和时间戳，方便开发每日余额状态图。集合中存储的字段如下：
* "_id" : ObjectId("5a97c93ce967911548fa15c7"), _mongodb分配的id_
* "account" : "0x309a272885bdea62d99c4e32e40bee93a3ccef6a", _账户地址，已经建立索引方便查找_
* "value" : 1000000000000000000, _本次交易的金额，正数为转入，负数为转出_
* "balance" : 6.9999999e+25, _交易后的账户余额_
* "timestamp" : 1500614148 _交易时间戳_

3. tx: 存储以太坊中的Transfer和Approval事件日志记录，集合中存储的字段如下：
* "_id" : "4063375_22_11", _交易id_
* "address" : "0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74", 
* "blockNumber" : 4063375, _交易日志所在的块号_
* "transactionHash" : "0x66db06af38219aa8fbaf4c0920ad5094344fbf8252490eda7863c7e27492efc2", 
* "transactionIndex" : 22, _创建事件的交易在块中的位置_
* "blockHash" : "0x8d2716500a0232828c1fcf4be97143cfc7fd48ba192a7e4a985646e6603d44b8", 
* "logIndex" : 11, _交易日志在块中的位置_
* "removed" : false, _创建事件的交易是否被删除了_
* "event" : "Transfer", _事件名字_
* "args" : { 
	"_from" : "0xbaa1b522575a857b431425d669e6f354045a902f", _转出账户地址_
	"_to" : "0xafdc9c21a071ecd189c271c83725db0f1676fa84", _转入账户地址_
	"_value" : 68319491200000000000 _交易金额_
}, 
* "timestamp" : 1500832627 _时间戳_

4. state：保存同步过程中的中间状态，如果同步未完成，重新启动程序时可以恢复状态继续同步。集合中存储的字段如下：
* "_id" : "exporterState", 
* "analysisBlock" : 4080000, _当前需要分析的以太坊区块号，小于这个区块号的区块中的交易记录已经分析完成，程序重启后从这个区块开始分析_
* "initApply" : true _将初始wtc币加入初始账户中，initApply标记是否完成_


## 在node.js代码中使用数据库示例

我们需要查询某个账户每天的余额可以用如下方法：

```javascript
// 在"record"集合中，查找accountAddress所有的交易余额记录，按时间戳升序排列
db.collection("record").find({ "account": accountAddress }).sort({ timestamp: 1 }).toArray(function(err, records) {
	// 创建用来保存结果的数组
	var result = new Array();

	// 遍历数据库中返回的所有记录
	for (i = 1; i < records.length; ++i) {
		var date = new Date(records[i].timestamp * 1000);
		var preDate = new Date(records[i-1].timestamp * 1000);
		if (date.getDate() != preDate.getDate()) {
			// 将前一天的最后一笔余额记录加入result数组
			result.push(records[i-1])
		}
		if (i == records.length-1) {
			// 最后一笔交易余额加入result数组
			result.push(records[i])
		}
	}

	// 接下来将result数组用于前端显示...

});
```