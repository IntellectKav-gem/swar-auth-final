a=[1,1,1,3,5,7,]
i=0
for j in range(len(a)):
    if a[j]!=a[j+1]:
        a[i]=a[j]
        i+=1
return i+1