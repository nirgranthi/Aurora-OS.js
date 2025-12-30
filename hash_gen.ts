const hashString = (str: string) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
};

console.log('name:', hashString('aurora-os-js'));
console.log('author:', hashString('Cătălin-Robert Drăgoiu'));
console.log('license:', hashString('AGPL-3.0'));
